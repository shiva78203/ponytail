/*
 * Ember Blade — an original top-down hack-and-slash homebrew for PSP.
 * Built against PSPSDK (sceGu 2D immediate-mode rendering, sceCtrl input).
 */

#include <pspkernel.h>
#include <pspdisplay.h>
#include <pspdebug.h>
#include <pspctrl.h>
#include <pspgu.h>
#include <psprtc.h>
#include <stdlib.h>
#include <string.h>

PSP_MODULE_INFO("Ember Blade", 0, 1, 0);
PSP_MAIN_THREAD_ATTR(THREAD_ATTR_USER | THREAD_ATTR_VFPU);

#define SCR_WIDTH  480
#define SCR_HEIGHT 272
#define BUF_WIDTH  512

#define MAX_ENEMIES 16
#define MAX_ORBS    16

static unsigned int __attribute__((aligned(16))) displayList[262144];

/* ---------------- Exit callback plumbing ---------------- */
static int exitRequest = 0;

static int exitCallback(int arg1, int arg2, void *common) {
    (void)arg1; (void)arg2; (void)common;
    exitRequest = 1;
    return 0;
}

static int callbackThread(SceSize args, void *argp) {
    (void)args; (void)argp;
    int cbid = sceKernelCreateCallback("Exit Callback", exitCallback, NULL);
    sceKernelRegisterExitCallback(cbid);
    sceKernelSleepThreadCB();
    return 0;
}

static void setupExitCallback(void) {
    int thid = sceKernelCreateThread("update_thread", callbackThread, 0x11, 0xFA0, 0, NULL);
    if (thid >= 0) sceKernelStartThread(thid, 0, NULL);
}

/* ---------------- Vertex format ---------------- */
struct Vertex {
    unsigned int color;
    float x, y, z;
};

static void drawRect(float x, float y, float w, float h, unsigned int color) {
    struct Vertex *v = (struct Vertex *)sceGuGetMemory(6 * sizeof(struct Vertex));
    v[0] = (struct Vertex){ color, x,     y,     0.0f };
    v[1] = (struct Vertex){ color, x + w, y,     0.0f };
    v[2] = (struct Vertex){ color, x,     y + h, 0.0f };
    v[3] = (struct Vertex){ color, x,     y + h, 0.0f };
    v[4] = (struct Vertex){ color, x + w, y,     0.0f };
    v[5] = (struct Vertex){ color, x + w, y + h, 0.0f };
    sceGuDrawArray(GU_TRIANGLES, GU_COLOR_8888 | GU_VERTEX_32BITF | GU_TRANSFORM_2D, 6, 0, v);
}

/* ---------------- Game state ---------------- */
typedef enum { STATE_TITLE, STATE_PLAYING, STATE_GAMEOVER } GameState;

typedef struct {
    int active;
    float x, y;
    float health, maxHealth;
    float speed;
    int hitFlash;
    int attackCooldown;
} Enemy;

typedef struct {
    int active;
    float x, y;
} Orb;

typedef struct {
    float x, y;
    float health, maxHealth;
    int facing;          /* -1 left, 1 right */
    int comboStep;        /* 0..2 */
    int comboTimer;
    int attackCooldown;
    int attackAnim;
    int invuln;
    int comboHits;
} Player;

static GameState state;
static Player player;
static Enemy enemies[MAX_ENEMIES];
static Orb orbs[MAX_ORBS];
static int score;
static int wave;
static int spawnTimer;
static unsigned int rngState = 12345;

static unsigned int nextRand(void) {
    rngState = rngState * 1103515245u + 12345u;
    return (rngState >> 16) & 0x7fff;
}
static float randRange(float lo, float hi) {
    return lo + (hi - lo) * ((float)(nextRand() % 1000) / 1000.0f);
}

static void resetGame(void) {
    player.x = SCR_WIDTH / 2.0f;
    player.y = SCR_HEIGHT / 2.0f;
    player.health = player.maxHealth = 100.0f;
    player.facing = 1;
    player.comboStep = 0;
    player.comboTimer = 0;
    player.attackCooldown = 0;
    player.attackAnim = 0;
    player.invuln = 0;
    player.comboHits = 0;

    for (int i = 0; i < MAX_ENEMIES; i++) enemies[i].active = 0;
    for (int i = 0; i < MAX_ORBS; i++) orbs[i].active = 0;

    score = 0;
    wave = 1;
    spawnTimer = 60;
}

static void spawnEnemy(void) {
    for (int i = 0; i < MAX_ENEMIES; i++) {
        if (!enemies[i].active) {
            int edge = nextRand() % 4;
            float x, y;
            switch (edge) {
                case 0: x = -16; y = randRange(20, SCR_HEIGHT - 20); break;
                case 1: x = SCR_WIDTH + 16; y = randRange(20, SCR_HEIGHT - 20); break;
                case 2: x = randRange(20, SCR_WIDTH - 20); y = -16; break;
                default: x = randRange(20, SCR_WIDTH - 20); y = SCR_HEIGHT + 16; break;
            }
            enemies[i].active = 1;
            enemies[i].x = x;
            enemies[i].y = y;
            enemies[i].maxHealth = 25.0f + wave * 4.0f;
            enemies[i].health = enemies[i].maxHealth;
            enemies[i].speed = 0.55f + wave * 0.04f;
            enemies[i].hitFlash = 0;
            enemies[i].attackCooldown = 0;
            return;
        }
    }
}

static void spawnOrb(float x, float y) {
    for (int i = 0; i < MAX_ORBS; i++) {
        if (!orbs[i].active) {
            orbs[i].active = 1;
            orbs[i].x = x;
            orbs[i].y = y;
            return;
        }
    }
}

static void performAttack(void) {
    if (player.attackCooldown > 0) return;

    if (player.comboTimer <= 0) player.comboStep = 0;
    int step = player.comboStep;

    float range = (step == 2) ? 42.0f : 32.0f;
    float dmg   = (step == 0) ? 12.0f : (step == 1) ? 15.0f : 24.0f;

    player.attackAnim = 10;
    int hitAny = 0;

    for (int i = 0; i < MAX_ENEMIES; i++) {
        if (!enemies[i].active) continue;
        float dx = enemies[i].x - player.x;
        float dy = enemies[i].y - player.y;
        float dist = (float)__builtin_sqrtf(dx * dx + dy * dy);
        if (dist > range) continue;
        /* must be roughly in the direction the player is facing */
        if ((player.facing == 1 && dx < -10) || (player.facing == -1 && dx > 10)) continue;

        enemies[i].health -= dmg;
        enemies[i].hitFlash = 6;
        hitAny = 1;

        if (enemies[i].health <= 0.0f) {
            enemies[i].active = 0;
            score += 25 * wave;
            spawnOrb(enemies[i].x, enemies[i].y);
        }
    }

    if (hitAny) player.comboHits++;

    player.comboTimer = 24;
    if (step >= 2) {
        player.attackCooldown = 18;
        player.comboStep = 0;
    } else {
        player.attackCooldown = 6;
        player.comboStep = step + 1;
    }
}

static void updatePlaying(SceCtrlData *pad) {
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.comboTimer > 0) player.comboTimer--;
    if (player.attackAnim > 0) player.attackAnim--;
    if (player.invuln > 0) player.invuln--;

    float speed = 2.1f;
    float dx = 0, dy = 0;
    if (pad->Buttons & PSP_CTRL_LEFT)  dx -= 1;
    if (pad->Buttons & PSP_CTRL_RIGHT) dx += 1;
    if (pad->Buttons & PSP_CTRL_UP)    dy -= 1;
    if (pad->Buttons & PSP_CTRL_DOWN)  dy += 1;

    /* analog stick as an alternative */
    if (abs(pad->Lx - 128) > 40) dx += (pad->Lx - 128) / 128.0f;
    if (abs(pad->Ly - 128) > 40) dy += (pad->Ly - 128) / 128.0f;

    if (dx != 0 || dy != 0) {
        float len = (float)__builtin_sqrtf(dx * dx + dy * dy);
        if (len > 1.0f) { dx /= len; dy /= len; }
        player.x += dx * speed;
        player.y += dy * speed;
        if (dx > 0.1f) player.facing = 1;
        if (dx < -0.1f) player.facing = -1;
    }

    if (player.x < 12) player.x = 12;
    if (player.x > SCR_WIDTH - 12) player.x = SCR_WIDTH - 12;
    if (player.y < 12) player.y = 12;
    if (player.y > SCR_HEIGHT - 12) player.y = SCR_HEIGHT - 12;

    static int prevCross = 0;
    int cross = pad->Buttons & PSP_CTRL_CROSS;
    if (cross && !prevCross) performAttack();
    prevCross = cross;

    /* enemy AI */
    int aliveCount = 0;
    for (int i = 0; i < MAX_ENEMIES; i++) {
        if (!enemies[i].active) continue;
        aliveCount++;
        if (enemies[i].hitFlash > 0) enemies[i].hitFlash--;
        if (enemies[i].attackCooldown > 0) enemies[i].attackCooldown--;

        float ex = player.x - enemies[i].x;
        float ey = player.y - enemies[i].y;
        float dist = (float)__builtin_sqrtf(ex * ex + ey * ey);
        if (dist > 18.0f) {
            enemies[i].x += (ex / dist) * enemies[i].speed;
            enemies[i].y += (ey / dist) * enemies[i].speed;
        } else if (enemies[i].attackCooldown <= 0 && player.invuln <= 0) {
            player.health -= 8.0f;
            player.invuln = 40;
            enemies[i].attackCooldown = 50;
        }
    }

    if (aliveCount == 0) {
        spawnTimer--;
        if (spawnTimer <= 0) {
            wave++;
            int toSpawn = 2 + wave;
            for (int i = 0; i < toSpawn && i < MAX_ENEMIES; i++) spawnEnemy();
            spawnTimer = 60;
        }
    }

    /* orb pickup */
    for (int i = 0; i < MAX_ORBS; i++) {
        if (!orbs[i].active) continue;
        float ox = player.x - orbs[i].x;
        float oy = player.y - orbs[i].y;
        if (__builtin_sqrtf(ox * ox + oy * oy) < 14.0f) {
            player.health += 10.0f;
            if (player.health > player.maxHealth) player.health = player.maxHealth;
            orbs[i].active = 0;
        }
    }

    if (player.health <= 0) state = STATE_GAMEOVER;
}

static void renderPlaying(void) {
    /* arena floor */
    drawRect(0, 0, SCR_WIDTH, SCR_HEIGHT, 0xFF241812);
    for (int i = 0; i < 12; i++) drawRect(i * 44.0f, 0, 2, SCR_HEIGHT, 0xFF3a2a1e);

    for (int i = 0; i < MAX_ORBS; i++) {
        if (!orbs[i].active) continue;
        drawRect(orbs[i].x - 4, orbs[i].y - 4, 8, 8, 0xFF40D080);
    }

    for (int i = 0; i < MAX_ENEMIES; i++) {
        if (!enemies[i].active) continue;
        unsigned int col = enemies[i].hitFlash > 0 ? 0xFFFFFFFF : 0xFF2020C8;
        drawRect(enemies[i].x - 9, enemies[i].y - 14, 18, 28, col);
        /* health bar */
        float pct = enemies[i].health / enemies[i].maxHealth;
        if (pct < 0) pct = 0;
        drawRect(enemies[i].x - 10, enemies[i].y - 22, 20, 3, 0xFF202020);
        drawRect(enemies[i].x - 10, enemies[i].y - 22, 20 * pct, 3, 0xFF2020E8);
    }

    /* player */
    unsigned int pcol = (player.invuln > 0 && (player.invuln / 4) % 2 == 0) ? 0xFF8080FF : 0xFF3050E0;
    drawRect(player.x - 8, player.y - 15, 16, 30, pcol);
    /* tattoo/accent stripe */
    drawRect(player.x - 8 + (player.facing == 1 ? 0 : 12), player.y - 15, 4, 30, 0xFF2030A8);

    if (player.attackAnim > 0) {
        float reach = (player.comboStep == 0 ? 42.0f : 32.0f);
        float sx = player.facing == 1 ? player.x + 8 : player.x - 8 - reach;
        drawRect(sx, player.y - 12, reach, 6, 0xFF30D0FF);
    }

    pspDebugScreenSetXY(1, 1);
    pspDebugScreenPrintf("EMBER BLADE   WAVE %d   SCORE %d", wave, score);
    pspDebugScreenSetXY(1, 2);
    pspDebugScreenPrintf("HP %3d/100   COMBO x%d", (int)player.health, player.comboHits);
}

static void renderTitle(void) {
    drawRect(0, 0, SCR_WIDTH, SCR_HEIGHT, 0xFF1a1210);
    pspDebugScreenSetXY(14, 8);
    pspDebugScreenPrintf("E M B E R   B L A D E");
    pspDebugScreenSetXY(10, 11);
    pspDebugScreenPrintf("D-Pad / Stick : move");
    pspDebugScreenSetXY(10, 12);
    pspDebugScreenPrintf("X             : slash (chain for combo)");
    pspDebugScreenSetXY(10, 14);
    pspDebugScreenPrintf("START to begin");
}

static void renderGameOver(void) {
    drawRect(0, 0, SCR_WIDTH, SCR_HEIGHT, 0xFF100808);
    pspDebugScreenSetXY(14, 9);
    pspDebugScreenPrintf("YOU HAVE FALLEN");
    pspDebugScreenSetXY(14, 11);
    pspDebugScreenPrintf("Score: %d   Wave: %d", score, wave);
    pspDebugScreenSetXY(10, 13);
    pspDebugScreenPrintf("START to try again");
}

int main(int argc, char *argv[]) {
    (void)argc; (void)argv;

    setupExitCallback();
    pspDebugScreenInit();

    sceCtrlSetSamplingCycle(0);
    sceCtrlSetSamplingMode(PSP_CTRL_MODE_ANALOG);

    void *fbp0_real = (void *)0;
    void *fbp1 = (void *)(BUF_WIDTH * SCR_HEIGHT * 4);

    sceGuInit();
    sceGuStart(GU_DIRECT, displayList);
    sceGuDrawBuffer(GU_PSM_8888, fbp0_real, BUF_WIDTH);
    sceGuDispBuffer(SCR_WIDTH, SCR_HEIGHT, fbp1, BUF_WIDTH);
    sceGuOffset(2048 - (SCR_WIDTH / 2), 2048 - (SCR_HEIGHT / 2));
    sceGuViewport(2048, 2048, SCR_WIDTH, SCR_HEIGHT);
    sceGuDepthRange(65535, 0);
    sceGuScissor(0, 0, SCR_WIDTH, SCR_HEIGHT);
    sceGuEnable(GU_SCISSOR_TEST);
    sceGuFrontFace(GU_CW);
    sceGuShadeModel(GU_FLAT);
    sceGuDisable(GU_TEXTURE_2D);
    sceGuDisable(GU_DEPTH_TEST);
    sceGuFinish();
    sceGuSync(0, 0);

    sceDisplayWaitVblankStart();
    sceGuDisplay(GU_TRUE);

    state = STATE_TITLE;
    resetGame();

    static int prevStart = 0;

    while (!exitRequest) {
        SceCtrlData pad;
        sceCtrlPeekBufferPositive(&pad, 1);
        int start = pad.Buttons & PSP_CTRL_START;

        sceGuStart(GU_DIRECT, displayList);
        sceGuClearColor(0xFF000000);
        sceGuClear(GU_COLOR_BUFFER_BIT);

        switch (state) {
            case STATE_TITLE:
                renderTitle();
                if (start && !prevStart) { resetGame(); state = STATE_PLAYING; }
                break;
            case STATE_PLAYING:
                updatePlaying(&pad);
                renderPlaying();
                break;
            case STATE_GAMEOVER:
                renderGameOver();
                if (start && !prevStart) { resetGame(); state = STATE_PLAYING; }
                break;
        }
        prevStart = start;

        sceGuFinish();
        sceGuSync(0, 0);

        sceDisplayWaitVblankStart();
        sceGuSwapBuffers();
    }

    sceGuTerm();
    sceKernelExitGame();
    return 0;
}
