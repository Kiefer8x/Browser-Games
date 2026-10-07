/*
    James William Fletcher  ( notabug.org/Vandarin )
        December 2023       ( github.com/mrbid     )

    It's Serious Shooter! Not Serious Tux, yet, Sam!
*/

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef WEB
    #include <emscripten.h>
    #include <emscripten/html5.h>
    #define GL_GLEXT_PROTOTYPES
    #define EGL_EGLEXT_PROTOTYPES
#endif

#define uint GLuint
#define sint GLint

#include "inc/gl.h"
#define GLFW_INCLUDE_NONE
#include "inc/glfw3.h"
#define fTime() (float)glfwGetTime()

#define MAX_MODELS 34 // hard limit, be aware and increase if needed
#include "inc/esAux5.h"

#include "inc/res.h"
#include "assets/crosshair.h" //31
#ifdef LOW
    #include "assets/low/scene.h"    //0
    #include "assets/low/ak47.h"     //1
    #include "assets/low/pistol.h"   //2
    #include "assets/low/revolver.h" //3
    #include "assets/low/flash.h"    //4
    #include "assets/low/pig1.h"     //5
    #include "assets/low/pig2.h"     //6
    #include "assets/low/girl.h"     //7
    #include "assets/low/octo.h"     //8
    #include "assets/low/bird1.h"    //9
    #include "assets/low/snail.h"    //10
    #include "assets/low/thing.h"    //11
    #include "assets/low/ted1.h"     //12
    #include "assets/low/bird2.h"    //13
    #include "assets/low/dunno.h"    //14
    #include "assets/low/owl.h"      //15
    #include "assets/low/cat.h"      //16
    #include "assets/low/bunny.h"    //17
    #include "assets/low/alien1.h"   //18
    #include "assets/low/ted2.h"     //19
    #include "assets/low/alien2.h"   //20
    #include "assets/low/deer.h"     //21
    #include "assets/low/ted3.h"     //22
    #include "assets/low/eye.h"      //23
    #include "assets/low/fox.h"      //24
    #include "assets/low/mystic.h"   //25
    #include "assets/low/devil.h"    //26
    #include "assets/low/cop.h"      //27
    #include "assets/low/queen.h"    //28
    #include "assets/low/pharo.h"    //29
    #include "assets/low/ufo.h"      //30
    #include "assets/low/colt.h"     //32
    #include "assets/low/goldak.h"   //33
#elif MED
    #include "assets/med/scene.h"    //0
    #include "assets/med/ak47.h"     //1
    #include "assets/med/pistol.h"   //2
    #include "assets/med/revolver.h" //3
    #include "assets/med/flash.h"    //4
    #include "assets/med/pig1.h"     //5
    #include "assets/med/pig2.h"     //6
    #include "assets/med/girl.h"     //7
    #include "assets/med/octo.h"     //8
    #include "assets/med/bird1.h"    //9
    #include "assets/med/snail.h"    //10
    #include "assets/med/thing.h"    //11
    #include "assets/med/ted1.h"     //12
    #include "assets/med/bird2.h"    //13
    #include "assets/med/dunno.h"    //14
    #include "assets/med/owl.h"      //15
    #include "assets/med/cat.h"      //16
    #include "assets/med/bunny.h"    //17
    #include "assets/med/alien1.h"   //18
    #include "assets/med/ted2.h"     //19
    #include "assets/med/alien2.h"   //20
    #include "assets/med/deer.h"     //21
    #include "assets/med/ted3.h"     //22
    #include "assets/med/eye.h"      //23
    #include "assets/med/fox.h"      //24
    #include "assets/med/mystic.h"   //25
    #include "assets/med/devil.h"    //26
    #include "assets/med/cop.h"      //27
    #include "assets/med/queen.h"    //28
    #include "assets/med/pharo.h"    //29
    #include "assets/med/ufo.h"      //30
    #include "assets/med/colt.h"     //32
    #include "assets/med/goldak.h"   //33
#else
    #include "assets/high/scene.h"    //0
    #include "assets/high/ak47.h"     //1
    #include "assets/high/pistol.h"   //2
    #include "assets/high/revolver.h" //3
    #include "assets/high/flash.h"    //4
    #include "assets/high/pig1.h"     //5
    #include "assets/high/pig2.h"     //6
    #include "assets/high/girl.h"     //7
    #include "assets/high/octo.h"     //8
    #include "assets/high/bird1.h"    //9
    #include "assets/high/snail.h"    //10
    #include "assets/high/thing.h"    //11
    #include "assets/high/ted1.h"     //12
    #include "assets/high/bird2.h"    //13
    #include "assets/high/dunno.h"    //14
    #include "assets/high/owl.h"      //15
    #include "assets/high/cat.h"      //16
    #include "assets/high/bunny.h"    //17
    #include "assets/high/alien1.h"   //18
    #include "assets/high/ted2.h"     //19
    #include "assets/high/alien2.h"   //20
    #include "assets/high/deer.h"     //21
    #include "assets/high/ted3.h"     //22
    #include "assets/high/eye.h"      //23
    #include "assets/high/fox.h"      //24
    #include "assets/high/mystic.h"   //25
    #include "assets/high/devil.h"    //26
    #include "assets/high/cop.h"      //27
    #include "assets/high/queen.h"    //28
    #include "assets/high/pharo.h"    //29
    #include "assets/high/ufo.h"      //30
    #include "assets/high/colt.h"     //32
    #include "assets/high/goldak.h"   //33
#endif

//*************************************
// globals
//*************************************
const char appTitle[]="Serious Shooter";
GLFWwindow* window;
uint winw=1024, winh=768;
float t=0.f, dt=0.f, lt=0.f, ltut = 0.f, st=0.f, fc=0.f, lfct=0.f, aspect;
double mx,my,lx,ly,ww,wh;
uint ldown = 0;

// render state
mat projection, view, model, modelview;

// game vars
#define FAR_DISTANCE 333.f
#define NEWGAME_SEED 1337
char tts[32];
uint keystate[5] = {0};

// camera vars
uint focus_cursor = 0;
double sens = 0.003f;
float xrot = 0.f;
vec lookx, looky, lookz;

// player vars
float MOVE_SPEED = 0.6f;
vec pp;

// weapons vars
uint  weapon = 1;
float wepoff = 0.f;
float wepkick = 0.f;
float wepflash = 0.f;
float wepfreq = 0.f;
uint  rkick = 0;

// stats
uint shotshit;
uint shotsfired;
uint alienskilled;
uint normieskilled;

// ufo
vec ufo_pos;
vec ufo_spawnpos;

// enemies
#define MAX_ENEMIES 128
uint    et[MAX_ENEMIES]; // type (0 = free)
uint    ed[MAX_ENEMIES]; // dying state
float  edr[MAX_ENEMIES]; // dying state rotation
uint   ehs[MAX_ENEMIES]; // hit state
float ehsr[MAX_ENEMIES]; // hit state rotation
float   ex[MAX_ENEMIES]; // pos x-coord
float   ey[MAX_ENEMIES]; // pos y-coord
float  edx[MAX_ENEMIES]; // dir x-coord
float  edy[MAX_ENEMIES]; // dir y-coord
float   es[MAX_ENEMIES]; // speed
int     eh[MAX_ENEMIES]; // hits left (like health)
uint   emh[MAX_ENEMIES]; // max hits (like max health)
float  eut[MAX_ENEMIES]; // next dir update time
float nespt = 0.f;

//*************************************
// utility functions
//*************************************
void timestamp(char* ts)
{
    const time_t tt = time(0);
    strftime(ts, 16, "%H:%M:%S", localtime(&tt));
}
void timeTaken(uint ss)
{
    if(ss == 1)
    {
        const double tt = t-st;
        if(tt < 60.0)
            sprintf(tts, "%.0f Sec", tt);
        else if(tt < 3600.0)
            sprintf(tts, "%.2f Min", tt * 0.016666667);
        else if(tt < 216000.0)
            sprintf(tts, "%.2f Hr", tt * 0.000277778);
        else if(tt < 12960000.0)
            sprintf(tts, "%.2f Days", tt * 0.00000463);
    }
    else
    {
        const double tt = t-st;
        if(tt < 60.0)
            sprintf(tts, "%.0f Seconds", tt);
        else if(tt < 3600.0)
            sprintf(tts, "%.2f Minutes", tt * 0.016666667);
        else if(tt < 216000.0)
            sprintf(tts, "%.2f Hours", tt * 0.000277778);
        else if(tt < 12960000.0)
            sprintf(tts, "%.2f Days", tt * 0.00000463);
    }
}
void updateModelView()
{
    mMul(&modelview, &model, &view);
    glUniformMatrix4fv(modelview_id, 1, GL_FALSE, (float*)&modelview.m[0][0]);
}
void updateTitle()
{
    if(t < 8.f){return;}
    char tmp[256];
    sprintf(tmp, "🔫 %u/%u - 👽 %u - 🤦 %u", shotshit, shotsfired, alienskilled, normieskilled);
    glfwSetWindowTitle(window, tmp);
}

//*************************************
// game functions
//*************************************
void resetEnemy(const uint id)
{
    et[id] = 0; // type (0 = free)
    ed[id] = 0; // dying state
    edr[id] = 0.f; // dying state rotation
    ehs[id] = 0; // hit state
    ehsr[id] = 0.f; // hit state rotation
    ex[id] = 0.f; // pos x-coord
    ey[id] = 0.f; // pos y-coord
    edx[id] = 0.f; // dir x-coord
    edy[id] = 0.f; // dir y-coord
    es[id] = 0.f; // speed
    eh[id] = 0; // hits left (like health)
    emh[id] = 0; // max hits (like max health)
    eut[id] = 0.f; // next dir update time
}
void spawnEnemyPos(const float x, const float y)
{
    for(uint i = 0; i < MAX_ENEMIES; i++)
    {
        if(et[i] == 0)
        {
            et[i] = esRand(1, 20);
            const float a = esRandFloat(-PI, PI);
            ex[i] = x, ey[i] = y;
            es[i] = esRandFloat(1.f, 3.f);
            emh[i]= esRand(4, 16);
            eh[i] = emh[i];
            break;
        }
    }
}
void spawnAlienPos(const float x, const float y)
{
    for(uint i = 0; i < MAX_ENEMIES; i++)
    {
        if(et[i] == 0)
        {
            et[i] = esRand(20, 25);
            const float a = esRandFloat(-PI, PI);
            ex[i] = x, ey[i] = y;
            es[i] = esRandFloat(3.f, 5.f);
            emh[i]= esRand(16, 24);
            eh[i] = emh[i];
            break;
        }
    }
}
void spawnEnemy()
{
    const float a = esRandFloat(-PI, PI);
    spawnEnemyPos(83.f * cosf(a), 83.f * sinf(a));
}
void doAttack()
{
    shotsfired++;

    // normalise look dir
    float lx = lookz.x, ly = lookz.y;
    const float len = 1.f/sqrtf(lx*lx + ly*ly);
    lx *= len, ly *= len;

    // enemies
    int sid = -1;
    float sdis = 333.f;
    for(uint i = 0; i < MAX_ENEMIES; i++)
    {
        if(et[i] != 0 && ed[i] == 0)
        {
            float tlx = lx, tly = ly;

            float xm = (-pp.x - ex[i]);
            float ym = (-pp.y - ey[i]);
            float dist1 = sqrtf(xm*xm + ym*ym);

            tlx *= dist1;
            tly *= dist1;

            tlx += -pp.x;
            tly += -pp.y;

            xm = (tlx - ex[i]);
            ym = (tly - ey[i]);
            float dist = xm*xm + ym*ym;

            if(weapon == 4 && dist < 0.36f) // let the gold colt go through multiple enemies at once
            {
                shotshit++;
                eh[i]-=1337;
                ehs[i] = 1;
                if(eh[i] <= 0)
                {
                    eh[i] = 0;
                    if(ed[i] == 0)
                    {
                        if(et[i] >= 20 && et[i] <= 25){alienskilled++;}else{normieskilled++;}
                        updateTitle();
                    }
                    ed[i] = 1;
                }
            }
            else if(dist < 0.36f && dist1 < sdis) // all other guns hit the nearest and stop there
            {
                sdis = dist1;
                sid = i;
            }
        }
    }

    if(sid != -1)
    {
        shotshit++;
        if(weapon == 1){eh[sid]-=4;}
        else if(weapon == 2){eh[sid]-=8;}
        else if(weapon == 3){eh[sid]--;}
        else if(weapon == 5){eh[sid]-=1337;}
        ehs[sid] = 1;
        if(eh[sid] <= 0)
        {
            eh[sid] = 0;
            if(ed[sid] == 0)
            {
                if(et[sid] >= 20 && et[sid] <= 25){alienskilled++;}else{normieskilled++;}
                updateTitle();
            }
            ed[sid] = 1;
        }
    }
}
void newGame(unsigned int seed)
{
    srand(seed);
    srandf(seed);
    
    pp = (vec){0.f, 0.f, 0.f};
    ufo_pos = (vec){0.f, 0.f, 3.f};
    const float a = esRandFloat(-PI, PI);
    const float r = esRandFloat(70.f, 83.f);
    ufo_spawnpos.x = r * cosf(a);
    ufo_spawnpos.y = r * sinf(a);
    weapon = 1;
    wepoff = 0.f;
    wepkick = 0.f;
    wepflash = 0.f;
    wepfreq = 0.f;
    rkick = 0;
    xrot = 0.f;
    lt = 0.f;
    ltut = 0.f;
    nespt = 0.f;
    shotshit = 0;
    shotsfired = 0;
    alienskilled = 0;
    normieskilled = 0;

    for(uint i = 0; i < MAX_ENEMIES; i++)
        resetEnemy(i);

    char strts[16];
    timestamp(&strts[0]);
    printf("[%s] Game Start [%u].\n", strts, seed);
    
    glfwSetWindowTitle(window, appTitle);
    glfwSetTime(0.0);
}

//*************************************
// update & render
//*************************************
void main_loop()
{
//*************************************
// core logic
//*************************************
    fc++;
    glfwPollEvents();
    t = fTime();
    dt = t-lt;
    lt = t;

#ifdef WEB
    EmscriptenPointerlockChangeEvent e;
    if(emscripten_get_pointerlock_status(&e) == EMSCRIPTEN_RESULT_SUCCESS)
    {
        if(focus_cursor == 0 && e.isActive == 1)
        {
            glfwGetCursorPos(window, &lx, &ly);
        }
        focus_cursor = e.isActive;
    }
#endif

//*************************************
// game logic
//*************************************

    // update title every second
    if(t > ltut)
    {
        updateTitle();
        ltut = t + 1.0f;
    }

    // collision bounds
    float pmod = pp.x*pp.x + pp.y*pp.y;
    if(pmod > 7056.f)
    {
        pmod = sqrt(pp.x*pp.x + pp.y*pp.y);
        float nx = pp.x, ny = pp.y;
        const float len = 1.f/sqrtf(nx*nx + ny*ny);
        nx *= len, ny *= len;
        const float d = pmod-84.f;
        nx *= d, ny *= d;
        pp.x -= nx, pp.y -= ny;
    }

    // forward & backward
    if(keystate[2] == 1)
    {
        vec m;
        vMulS(&m, lookz, MOVE_SPEED * dt);
        vSub(&pp, pp, m);
    }
    else if(keystate[3] == 1)
    {
        vec m;
        vMulS(&m, lookz, MOVE_SPEED * dt);
        vAdd(&pp, pp, m);
    }

    // strafe left & right
    if(keystate[0] == 1)
    {
        vec m;
        vMulS(&m, lookx, MOVE_SPEED * dt);
        vSub(&pp, pp, m);
    }
    else if(keystate[1] == 1)
    {
        vec m;
        vMulS(&m, lookx, MOVE_SPEED * dt);
        vAdd(&pp, pp, m);
    }

    // sprint
    if(keystate[4] == 1)
    {
        MOVE_SPEED = 16.3f;
    }
    else
    {
        MOVE_SPEED = 4.2f;
    }

    // lock to floor
    pp.z = -1.3f;

    // enemy spawner
    if(t > nespt)
    {
        spawnEnemy();
        nespt = t + esRandFloat(0.1f, 4.f);
    }
    if(ufo_pos.x == ufo_spawnpos.x && ufo_pos.y == ufo_spawnpos.y)
    {
        spawnAlienPos(ufo_spawnpos.x, ufo_spawnpos.y);
        const float a = esRandFloat(-PI, PI);
        const float r = esRandFloat(70.f, 83.f);
        ufo_spawnpos.x = r * cosf(a);
        ufo_spawnpos.y = r * sinf(a);
    }

    // move ufo
    const float uxi = ufo_spawnpos.x - ufo_pos.x;
    const float uyi = ufo_spawnpos.y - ufo_pos.y;
    if(fabsf(uxi) < 0.01f){ufo_pos.x = ufo_spawnpos.x;}
    if(fabsf(uyi) < 0.01f){ufo_pos.y = ufo_spawnpos.y;}
    ufo_pos.x += uxi*0.01f;
    ufo_pos.y += uyi*0.01f;

//*************************************
// camera
//*************************************
    if(focus_cursor == 1)
    {
        glfwGetCursorPos(window, &mx, &my);
        xrot += (lx-mx)*sens;
        lx = mx;
    }
    mIdent(&view);
    mRotate(&view, d2PI, 1.f, 0.f, 0.f);
    mRotate(&view, xrot, 0.f, 0.f, 1.f);
    mTranslate(&view, pp.x, pp.y, pp.z);

    // get look dir/axes
    mGetViewZ(&lookz, view);
    mGetViewX(&lookx, view);
    mGetViewY(&looky, view);

//*************************************
// render
//*************************************

    // clear buffer
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    // render scene
    glUniformMatrix4fv(modelview_id, 1, GL_FALSE, (float*)&view.m[0][0]);
    esBindRender(0);

    // render ufo
    mIdent(&model);
    mSetPos(&model, ufo_pos);
    mRotZ(&model, t * 2.f);
    updateModelView();
    esBindRender(30);

    // render enemies
    for(uint i = 0; i < MAX_ENEMIES; i++)
    {
        if(et[i] != 0)
        {
            mIdent(&model);
            mSetPos(&model, (vec){ex[i], ey[i], 0.f});
            mSetDir(&model, (vec){edx[i], edy[i], 0.f});
            if(ed[i] == 1)
            {
                if(edr[i] > d2PI)
                {
                    mSetPos(&model, (vec){ex[i], ey[i], -(edr[i]-d2PI)});
                    if(et[i] == 1 || et[i] == 2 || et[i] == 5 || et[i] == 6 || et[i] == 9 || et[i] == 12 || et[i] == 13 || et[i] == 17)
                        mRotX(&model, d2PI);
                    else
                        mRotY(&model, d2PI);
                    edr[i] += 0.75f * dt;
                    if(edr[i] > d2PI+3.f)
                    {
                        resetEnemy(i);
                        continue;
                    }
                }
                else
                {
                    if(et[i] == 1 || et[i] == 2 || et[i] == 5 || et[i] == 6 || et[i] == 9 || et[i] == 12 || et[i] == 13 || et[i] == 17)
                        mRotX(&model, edr[i]);
                    else
                        mRotY(&model, edr[i]);
                    edr[i] += 3.6f * dt;
                }
            }
            else
            {
                if(ehs[i] > 0)
                {
                    edx[i] = -pp.x, edy[i] = -pp.y;
                    edx[i] -= ex[i], edy[i] -= ey[i];
                    const float len = 1.f/sqrtf(edx[i]*edx[i] + edy[i]*edy[i]);
                    edx[i] *= len, edy[i] *= len;
                    mRotY(&model, ehsr[i]);
                    if(ehs[i] == 1)
                    {
                        ehsr[i] += 3.6f * dt;
                        if(ehsr[i] > 0.64f){ehs[i] = 2;}
                    }
                    else
                    {
                        ehsr[i] -= 3.6f * dt;
                        if(ehsr[i] <= 0.f)
                        {
                            ehs[i] = 0;
                            ehsr[i] = 0.f;
                        }
                    }
                    if(weapon == 2)
                    {
                        ex[i] -= edx[i] * 6.f * dt;
                        ey[i] -= edy[i] * 6.f * dt;
                    }
                    else
                    {
                        ex[i] -= edx[i] * 1.f * dt;
                        ey[i] -= edy[i] * 1.f * dt;
                    }
                }
                else
                {
                    float emod = ex[i]*ex[i] + ey[i]*ey[i];
                    if(t > eut[i] || emod > 7056.f)
                    {
                        edx[i] = -pp.x, edy[i] = -pp.y;
                        edx[i] -= ex[i], edy[i] -= ey[i];
                        const float len = 1.f/sqrtf(edx[i]*edx[i] + edy[i]*edy[i]);
                        edx[i] *= len, edy[i] *= len;
                        eut[i] = t + esRandFloat(0.3f, 8.f);
                    }

                    ex[i] += edx[i] * es[i] * dt;
                    ey[i] += edy[i] * es[i] * dt;
                }
            }
            updateModelView();
            esBindRender(4+et[i]);
        }
    }

    // weapons
    vec np;
    if(weapon == 1)
    {
        if(t > wepkick)
        {
            wepoff = 0.f;
            wepkick = t+0.06f;
        }

        // position weapon
        vec ld = lookz;
        ld.z = 0.f;
        vMulS(&ld, ld, 0.79f-wepoff); // far from camera
        np = (vec){-pp.x, -pp.y, -pp.z};
        vAdd(&np, np, ld);

        // x offset
        vec vx = lookx;
        vMulS(&vx, vx, -0.4f);
        vAdd(&np, np, vx);

        // y offset
        vec vy = looky;
        vMulS(&vy, vy, 0.34f);
        vAdd(&np, np, vy);

        // muzzle flash relative to weapon position
        if(t < wepflash)
        {
            const float opad = (wepflash-t)*2.5f;

            vec fp = np;
            // x offset
            vx = lookx;
            vMulS(&vx, vx, -0.1f);
            vAdd(&fp, fp, vx);
            // y offset
            vy = looky;
            vMulS(&vy, vy, -0.17f);
            vAdd(&fp, fp, vy);
            // z offset
            vec vz = lookz;
            vMulS(&vz, vz, 0.46f);
            vAdd(&fp, fp, vz);

            mIdent(&model);
            mScale1(&model, 0.229f);
            mRotZ(&model, -(xrot+PI-0.23f));
            mRotX(&model, t*5.f); //randf()*x2PI
            mSetPos(&model, fp);
            updateModelView();
            glEnable(GL_BLEND);
            glUniform1f(opacity_id, opad);
            esBindRender(4);
            glDisable(GL_BLEND);
        }

        if(ldown == 1)
        {
            if(t > wepfreq)
            {
                doAttack();
                wepkick = t+0.06f;
                wepoff = 0.04f;
                const float fire_rate = t+0.4f;
                wepflash = fire_rate;
                wepfreq = wepflash;
            }
        }
    }
    else if(weapon == 2)
    {
        if(t > wepkick)
        {
            rkick = 0;
            wepkick = t+0.12f;
        }
        else if(t > wepkick-0.06f)
        {
            wepoff = 0.f;
        }

        // position weapon
        vec ld = lookz;
        ld.z = 0.f;
        vMulS(&ld, ld, 0.79f-wepoff); // far from camera
        np = (vec){-pp.x, -pp.y, -pp.z};
        vAdd(&np, np, ld);

        // x offset
        vec vx = lookx;
        vMulS(&vx, vx, -0.4f);
        vAdd(&np, np, vx);

        // y offset
        vec vy = looky;
        vMulS(&vy, vy, 0.34f);
        vAdd(&np, np, vy);

        // muzzle flash relative to weapon position
        if(t < wepflash)
        {
            const float opad = (wepflash-t)*1.25f;

            vec fp = np;
            // x offset
            vx = lookx;
            vMulS(&vx, vx, -0.10f);
            vAdd(&fp, fp, vx);
            // y offset
            vy = looky;
            vMulS(&vy, vy, -0.18f-((1.f-opad)*0.14f));
            // if(rkick == 1)
            //     vMulS(&vy, vy, -0.18f-((1.f-opad)*0.48f));
            // else
            //     vMulS(&vy, vy, -0.18f);
            vAdd(&fp, fp, vy);
            // z offset
            vec vz = lookz;
            vMulS(&vz, vz, 0.48f);
            vAdd(&fp, fp, vz);

            mIdent(&model);
            mScale1(&model, 0.229f);
            mRotZ(&model, -(xrot+PI-0.23f));
            mRotY(&model, (1.f-opad)*0.6f);
            mRotX(&model, t*5.f);
            mSetPos(&model, fp);
            updateModelView();
            glEnable(GL_BLEND);
            glUniform1f(opacity_id, opad);
            glDisable(GL_CULL_FACE);
            esBindRender(4);
            glEnable(GL_CULL_FACE);
            glDisable(GL_BLEND);
        }

        if(ldown == 1)
        {
            if(t > wepfreq)
            {
                doAttack();
                rkick = 1;
                wepkick = t+0.16f;
                wepoff = 0.09f;
                const float fire_rate = t+1.f;
                wepflash = t+0.8f;
                wepfreq = t+1.f;
            }
        }
    }
    else if(weapon == 3)
    {
        if(t > wepkick)
        {
            wepoff = 0.f;
            wepkick = t+0.03f;
        }
        
        // position weapon
        vec ld = lookz;
        ld.z = 0.f;
        vMulS(&ld, ld, 0.79f-wepoff); // far from camera
        np = (vec){-pp.x, -pp.y, -pp.z};
        vAdd(&np, np, ld);

        // x offset
        vec vx = lookx;
        vMulS(&vx, vx, -0.4f);
        vAdd(&np, np, vx);

        // y offset
        vec vy = looky;
        vMulS(&vy, vy, 0.34f);
        vAdd(&np, np, vy);

        if(t < wepflash)
        {
            const float opad = (wepflash-t)*10.f;

            vec fp = np;
            // x offset
            vx = lookx;
            vMulS(&vx, vx, -0.13f);
            vAdd(&fp, fp, vx);
            // y offset
            vy = looky;
            vMulS(&vy, vy, -0.16f);
            vAdd(&fp, fp, vy);
            // z offset
            vec vz = lookz;
            vMulS(&vz, vz, 0.7f);
            vAdd(&fp, fp, vz);

            mIdent(&model);
            mScale1(&model, 0.229f);
            mRotZ(&model, -(xrot+PI-0.23f));
            mRotX(&model, t*5.f); //randf()*x2PI
            mSetPos(&model, fp);
            updateModelView();
            glEnable(GL_BLEND);
            glUniform1f(opacity_id, opad);
            esBindRender(4);
            glDisable(GL_BLEND);
        }

        // muzzle flash relative to weapon position
        if(ldown == 1)
        {
            if(t > wepfreq)
            {
                doAttack();
                wepkick = t+0.03f;
                wepoff = 0.02f;
                const float fire_rate = t+0.1f;
                wepflash = fire_rate;
                wepfreq = wepflash;
            }
        }
    }
    else if(weapon == 4)
    {
        if(t > wepkick)
        {
            rkick = 0;
            wepkick = t+0.12f;
        }
        else if(t > wepkick-0.06f)
        {
            wepoff = 0.f;
        }

        // position weapon
        vec ld = lookz;
        ld.z = 0.f;
        vMulS(&ld, ld, 1.2f-wepoff); // far from camera
        np = (vec){-pp.x, -pp.y, -pp.z};
        vAdd(&np, np, ld);

        // x offset
        vec vx = lookx;
        vMulS(&vx, vx, -0.6f);
        vAdd(&np, np, vx);

        // y offset
        vec vy = looky;
        vMulS(&vy, vy, 0.34f);
        vAdd(&np, np, vy);

        // muzzle flash relative to weapon position
        if(t < wepflash)
        {
            const float opad = (wepflash-t)*1.25f;

            vec fp = np;
            // x offset
            vx = lookx;
            vMulS(&vx, vx, -0.08f);
            vAdd(&fp, fp, vx);
            // y offset
            vy = looky;
            vMulS(&vy, vy, -0.28f-((1.f-opad)*0.14f));
            vAdd(&fp, fp, vy);
            // z offset
            vec vz = lookz;
            vMulS(&vz, vz, 0.48f);
            vAdd(&fp, fp, vz);

            mIdent(&model);
            mScale1(&model, 0.229f);
            mRotZ(&model, -(xrot+PI-0.23f));
            mRotY(&model, (1.f-opad)*0.6f);
            mRotX(&model, t*5.f);
            mSetPos(&model, fp);
            updateModelView();
            glEnable(GL_BLEND);
            glUniform1f(opacity_id, opad);
            glDisable(GL_CULL_FACE);
            esBindRender(4);
            glEnable(GL_CULL_FACE);
            glDisable(GL_BLEND);
        }

        if(ldown == 1)
        {
            if(t > wepfreq)
            {
                doAttack();
                rkick = 1;
                wepkick = t+0.16f;
                wepoff = 0.09f;
                const float fire_rate = t+1.f;
                wepflash = t+0.8f;
                wepfreq = t+1.f;
            }
        }
    }
    else if(weapon == 5)
    {
        if(t > wepkick)
        {
            wepoff = 0.f;
            wepkick = t+0.03f;
        }
        
        // position weapon
        vec ld = lookz;
        ld.z = 0.f;
        vMulS(&ld, ld, 0.79f-wepoff); // far from camera
        np = (vec){-pp.x, -pp.y, -pp.z};
        vAdd(&np, np, ld);

        // x offset
        vec vx = lookx;
        vMulS(&vx, vx, -0.4f);
        vAdd(&np, np, vx);

        // y offset
        vec vy = looky;
        vMulS(&vy, vy, 0.34f);
        vAdd(&np, np, vy);

        if(t < wepflash)
        {
            const float opad = (wepflash-t)*10.f;

            vec fp = np;
            // x offset
            vx = lookx;
            vMulS(&vx, vx, -0.14f);
            vAdd(&fp, fp, vx);
            // y offset
            vy = looky;
            vMulS(&vy, vy, -0.14f);
            vAdd(&fp, fp, vy);
            // z offset
            vec vz = lookz;
            vMulS(&vz, vz, 0.7f);
            vAdd(&fp, fp, vz);

            mIdent(&model);
            mScale1(&model, 0.16f);
            mRotZ(&model, -(xrot+PI-0.23f));
            mRotX(&model, t*5.f); //randf()*x2PI
            mSetPos(&model, fp);
            updateModelView();
            glEnable(GL_BLEND);
            glUniform1f(opacity_id, opad);
            esBindRender(4);
            glDisable(GL_BLEND);
        }

        // muzzle flash relative to weapon position
        if(ldown == 1)
        {
            if(t > wepfreq)
            {
                doAttack();
                wepkick = t+0.03f;
                wepoff = 0.02f;
                const float fire_rate = t+0.1f;
                wepflash = fire_rate;
                wepfreq = wepflash;
            }
        }
    }

    // rotate to camera direction with slight offset and set pos
    mIdent(&model);
    mScale1(&model, 0.8f);
    mRotZ(&model, -(xrot+PI-0.23f));
    if(rkick == 1){mRotY(&model, 0.26f);}
    mSetPos(&model, np);

    // render weapon
    updateModelView();
    glClear(GL_DEPTH_BUFFER_BIT);
    esBindRender(weapon == 4 ? 32 : weapon ==  5 ? 33 : weapon); // lol 🤪
    
    // render crosshair
    vec ld = lookz;
    ld.z = 0.f;
    vMulS(&ld, ld, 32.f);
    np = (vec){-pp.x, -pp.y, -pp.z};
    vAdd(&np, np, ld);
    
    mIdent(&model);
    mSetPos(&model, np);
    mRotZ(&model, -xrot);
    mScale1(&model, 0.1f);
    updateModelView();
    esBindRender(31);

    //

    // display render
    glfwSwapBuffers(window);
}

//*************************************
// input
//*************************************
static void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods)
{
    // control
    if(action == GLFW_PRESS)
    {
        if(     key == GLFW_KEY_A || key == GLFW_KEY_LEFT)  { keystate[0] = 1; }
        else if(key == GLFW_KEY_D || key == GLFW_KEY_RIGHT) { keystate[1] = 1; }
        else if(key == GLFW_KEY_W || key == GLFW_KEY_UP)    { keystate[2] = 1; }
        else if(key == GLFW_KEY_S || key == GLFW_KEY_DOWN)  { keystate[3] = 1; }
        else if(key == GLFW_KEY_LEFT_SHIFT ||
                key == GLFW_KEY_RIGHT_CONTROL)              { keystate[4] = 1;}
        else if(key == GLFW_KEY_N) // new game
        {
            timeTaken(0);
            char strts[16];
            timestamp(&strts[0]);
            printf("[%s] Game End.\n", strts);
            printf("[%s] Shots Fired %u - Shots Hit %u - Aliens Killed %u - Normies Killed %u\n", strts, shotsfired, shotshit, alienskilled, normieskilled);
            printf("[%s] Time-Taken: %s or %g Seconds\n\n", strts, tts, t-st);
            newGame(time(0));
        }
        else if(key == GLFW_KEY_ESCAPE) // toggle mouse focus
        {
            focus_cursor = 0;
#ifndef WEB
            glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_NORMAL);
            glfwGetCursorPos(window, &lx, &ly);
#endif
        }
        else if(key == GLFW_KEY_F) // show average fps
        {
            if(t-lfct > 2.0)
            {
                char strts[16];
                timestamp(&strts[0]);
                printf("[%s] FPS: %g\n", strts, fc/(t-lfct));
                lfct = t;
                fc = 0;
            }
        }
        else if(key == GLFW_KEY_G)
        {
            weapon = 4;
            wepkick = 0.f;
            rkick = 0;
            wepflash = t;
        }
        else if(key == GLFW_KEY_P)
        {
            weapon = 5;
            wepkick = 0.f;
            rkick = 0;
            wepflash = t;
        }
    }
    else if(action == GLFW_RELEASE)
    {
        if(     key == GLFW_KEY_A || key == GLFW_KEY_LEFT)  { keystate[0] = 0; }
        else if(key == GLFW_KEY_D || key == GLFW_KEY_RIGHT) { keystate[1] = 0; }
        else if(key == GLFW_KEY_W || key == GLFW_KEY_UP)    { keystate[2] = 0; }
        else if(key == GLFW_KEY_S || key == GLFW_KEY_DOWN)  { keystate[3] = 0; }
        else if(key == GLFW_KEY_LEFT_SHIFT ||
                key == GLFW_KEY_RIGHT_CONTROL)              { keystate[4] = 0;}
    }
}
void scroll_callback(GLFWwindow* window, double xoffset, double yoffset)
{
    if(yoffset < 0.0){weapon--;}else{weapon++;}
    if(weapon > 3){weapon = 1;}
    if(weapon < 1){weapon = 3;}
    wepkick = 0.f;
    rkick = 0;
    wepflash = t;
}
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods)
{
    if(action == GLFW_PRESS)
    {
        if(focus_cursor == 0)
        {
            focus_cursor = 1;
#ifndef WEB
            glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
            glfwGetCursorPos(window, &lx, &ly);
#endif
            return;
        }
        else if(button == GLFW_MOUSE_BUTTON_LEFT)
        {
            ldown = 1;
        }
        else if(button == GLFW_MOUSE_BUTTON_RIGHT)
        {
            mIdent(&projection);
            mPerspective(&projection, 30.0f, aspect, 0.01f, FAR_DISTANCE);
            glUniformMatrix4fv(projection_id, 1, GL_FALSE, (float*)&projection.m[0][0]);
        }
    }
    else if(action == GLFW_RELEASE)
    {
        if(button == GLFW_MOUSE_BUTTON_LEFT)
        {
            ldown = 0;
            wepoff = 0.f;
        }
        else if(button == GLFW_MOUSE_BUTTON_RIGHT)
        {
            mIdent(&projection);
            mPerspective(&projection, 60.0f, aspect, 0.01f, FAR_DISTANCE);
            glUniformMatrix4fv(projection_id, 1, GL_FALSE, (float*)&projection.m[0][0]);
        }
    }
}
void window_size_callback(GLFWwindow* window, int width, int height)
{
    winw = width, winh = height;
    glViewport(0, 0, winw, winh);
    aspect = (float)winw / (float)winh;
    ww = winw, wh = winh;
    mIdent(&projection);
    mPerspective(&projection, 60.0f, aspect, 0.01f, FAR_DISTANCE);
    glUniformMatrix4fv(projection_id, 1, GL_FALSE, (float*)&projection.m[0][0]);
}
#ifdef WEB
EM_BOOL emscripten_resize_event(int eventType, const EmscriptenUiEvent *uiEvent, void *userData)
{
    winw = uiEvent->documentBodyClientWidth;
    winh = uiEvent->documentBodyClientHeight;
    window_size_callback(window, winw, winh);
    emscripten_set_canvas_element_size("canvas", winw, winh);
    return EM_FALSE;
}
#endif

//*************************************
// process entry point
//*************************************
int main(int argc, char** argv)
{
    // allow custom msaa level & mouse sensitivity
    int msaa = 16;
    if(argc >= 2){msaa = atoi(argv[1]);}
    if(argc >= 3){sens = atof(argv[2]);}

    // help
    printf("----\n");
    printf("James William Fletcher (github.com/mrbid) (notabug.org/Vandarin)\n");
    printf("%s - it's like Serious Sam, but Seriously Neurally Generated O_o.\n", appTitle);
    printf("----\n");
#ifndef WEB
    printf("Two command line arguments, msaa 0-16, mouse sensitivity.\n");
    printf("e.g; ./shooter 16 0.003\n");
    printf("----\n");
#endif
    printf("ESCAPE = Unlock Mouse\n");
    printf("W,A,S,D / Arrow Keys = Move\n");
    printf("L-SHIFT / R-CTRL = Sprint\n");
    printf("Left Click = Shoot\n");
    printf("Right Click = Zoom\n");
    printf("Mouse Scroll = Change Weapon\n");
    printf("----\n");
    printf("Assets all generated by Machine Learning / Artificial Intelligence using LUMA GENIE and MESHY.AI.\n");
    printf("Every asset, that's the environment, the guns, the enemies, and even the muzzle flash at a whopping 48,120 triangles!\n");
    printf("----\n");
    printf("Icon by Forest Walter\n");
    printf("https://www.forrestwalter.com/\n");
    printf("----\n");
    printf("Merry Christmas 2023! and a happy new year 2024!\n");
    printf("----\n");
    printf("%s\n", glfwGetVersionString());
    printf("----\n");

    // init glfw
    if(!glfwInit()){printf("glfwInit() failed.\n"); exit(EXIT_FAILURE);}
#ifdef WEB
    double width, height;
    emscripten_get_element_css_size("body", &width, &height);
    winw = (uint)width, winh = (uint)height;
#endif
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 2);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 0);
    glfwWindowHint(GLFW_SAMPLES, msaa);
    window = glfwCreateWindow(winw, winh, appTitle, NULL, NULL);
    if(!window)
    {
        printf("glfwCreateWindow() failed.\n");
        glfwTerminate();
        exit(EXIT_FAILURE);
    }
    const GLFWvidmode* desktop = glfwGetVideoMode(glfwGetPrimaryMonitor());
#ifndef WEB
    glfwSetWindowPos(window, (desktop->width/2)-(winw/2), (desktop->height/2)-(winh/2)); // center window on desktop
#endif
    if(glfwRawMouseMotionSupported() == GLFW_TRUE){glfwSetInputMode(window, GLFW_RAW_MOUSE_MOTION, GLFW_TRUE);} // raw input, since it's an FPS
    glfwSetWindowSizeCallback(window, window_size_callback);
    glfwSetKeyCallback(window, key_callback);
    glfwSetMouseButtonCallback(window, mouse_button_callback);
    glfwSetScrollCallback(window, scroll_callback);
    glfwMakeContextCurrent(window);
    gladLoadGL(glfwGetProcAddress);
    glfwSwapInterval(1); // 0 for immediate updates, 1 for updates synchronized with the vertical retrace, -1 for adaptive vsync

    // set icon
    glfwSetWindowIcon(window, 1, &(GLFWimage){16, 16, (unsigned char*)icon_image});

//*************************************
// bind vertex and index buffers
//*************************************
    register_scene();
    //esModelArray_index++;
    register_pistol();
    register_revolver();
    register_ak47();
    register_flash();
    register_pig1();
    register_pig2();
    register_girl();
    register_octo();
    register_bird1();
    register_snail();
    register_thing();
    register_ted1();
    register_bird2();
    register_dunno();
    register_owl();
    register_cat();
    register_bunny();
    register_alien1();
    register_ted2();
    register_alien2();
    register_deer();
    register_ted3();
    register_eye();
    register_fox();
    register_mystic();
    register_devil();
    register_cop();
    register_queen();
    register_pharo();
    register_ufo();
    register_crosshair();
    register_colt();
    register_goldak();

//*************************************
// compile & link shader programs
//*************************************
    makeLambert3();

//*************************************
// configure render options
//*************************************
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    glEnable(GL_CULL_FACE);
    glEnable(GL_DEPTH_TEST);

    glClearColor(0.3f, 0.745f, 0.8863f, 0.f);
    //glClearColor(0.59608f, 0.37647f, 0.65882f, 0.f);

    shadeLambert3(&position_id, &projection_id, &modelview_id, &lightpos_id, &normal_id, &color_id, &opacity_id);
    glUniformMatrix4fv(projection_id, 1, GL_FALSE, (float*)&projection.m[0][0]);
    window_size_callback(window, winw, winh);

//*************************************
// execute update / render loop
//*************************************

    // init
    newGame(NEWGAME_SEED);
    t = fTime();
    lfct = t;

#ifdef WEB
    emscripten_set_resize_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, NULL, EM_FALSE, emscripten_resize_event);
    emscripten_set_main_loop(main_loop, 0, 1);
#else
    while(!glfwWindowShouldClose(window)){main_loop();}
#endif

    // end
    timeTaken(0);
    char strts[16];
    timestamp(&strts[0]);
    printf("[%s] Game End.\n", strts);
    printf("[%s] Shots Fired %u - Shots Hit %u - Aliens Killed %u - Normies Killed %u\n", strts, shotsfired, shotshit, alienskilled, normieskilled);
    printf("[%s] Time-Taken: %s or %g Seconds\n\n", strts, tts, t-st);

    // done
    glfwDestroyWindow(window);
    glfwTerminate();
    exit(EXIT_SUCCESS);
    return 0;
}
