# Build the 7 missing referee signals from the user's Touchdown referee:
# keep his head, torso and legs exactly, erase the raised arms, draw new arms in the art's palette.
import numpy as np, math, json
from PIL import Image
from scipy import ndimage
OUT=(26,18,48)
SKIN=[(224,164,140),(212,147,121),(185,126,106),(158,106,90)]
WH=[(223,223,222),(192,192,191)];BK=[(33,33,33),(14,15,14)];BAND=(7,9,7)
base=np.array(Image.open('nat_touchdown.png')).astype(np.uint8)
H,W=base.shape[:2]
# ---- body without arms ----
body=base.copy()
for y in range(H):
    for x in range(W):
        if y<=16 and not (11<=x<=23): body[y,x]=0          # raised arms (head stays)
        if 17<=y<=24:                                      # shoulders: trim sleeves to a trapezoid
            lo=7+ (y-17)*2//7*1 + (y-17)//3; hi=27-(y-17)//3-(y-17)*2//7
            if x<lo or x>hi: body[y,x]=0
def reoutline(img):
    a=img[...,3]>0;core=a&~np.all(img[...,:3]==OUT,axis=2)
    core=ndimage.binary_opening(core,structure=np.ones((1,1)))
    out=img.copy();out[~core]=0
    ring=ndimage.binary_dilation(core,structure=[[0,1,0],[1,1,1],[0,1,0]])&~core
    out[ring]=(*OUT,255);return out
body=reoutline(body)
head=base.copy();head[:, :10]=0;head[:,25:]=0;head[17:]=0         # head layer for "hands behind head"
# ---- coordinates: game pose space -> native pixels ----
SL,SR=(8.5,19.5),(26.5,19.5)
def g2n(x,y):return ((x-64)*.6+17.5,(y-54)*.6+19.5)
UA,FA=10.5,10.0
def solve(s,spec):
    sx,sy=s
    if isinstance(spec,list):
        u,f=math.radians(spec[0]),math.radians(spec[1]);ex,ey=sx+math.cos(u)*UA,sy+math.sin(u)*UA
        return (sx,sy,ex,ey,ex+math.cos(f)*FA,ey+math.sin(f)*FA)
    tx,ty=g2n(*spec['h']);vx,vy=tx-sx,ty-sy;D=math.hypot(vx,vy);ux,uy=vx/D,vy/D
    if D>=UA+FA-.3:ex,ey=sx+ux*UA,sy+uy*UA;return(sx,sy,ex,ey,ex+ux*FA,ey+uy*FA)
    D=max(D,abs(UA-FA)+1);a=(UA*UA-FA*FA+D*D)/(2*D);h=math.sqrt(max(0,UA*UA-a*a));bx,by=sx+ux*a,sy+uy*a
    e=g2n(*spec.get('e',(64,100)));c1=(bx-uy*h,by+ux*h);c2=(bx+uy*h,by-ux*h)
    pk=c1 if math.hypot(c1[0]-e[0],c1[1]-e[1])<math.hypot(c2[0]-e[0],c2[1]-e[1]) else c2
    return(sx,sy,pk[0],pk[1],tx,ty)
def cap(buf,x0,y0,x1,y1,r,col):
    dx,dy=x1-x0,y1-y0;L2=dx*dx+dy*dy or 1e-9;L=math.sqrt(L2);nx,ny=-dy/L,dx/L
    for y in range(int(min(y0,y1)-r-2),int(max(y0,y1)+r+3)):
        for x in range(int(min(x0,x1)-r-2),int(max(x0,x1)+r+3)):
            X,Y=x+.5,y+.5;t=max(0,min(1,((X-x0)*dx+(Y-y0)*dy)/L2));qx,qy=x0+dx*t,y0+dy*t;d=math.hypot(X-qx,Y-qy)
            if d<=r and 0<=x<W and 0<=y<H:buf[(x,y)]=col(t*L,(X-x0)*nx+(Y-y0)*ny,(X-qx)*-.6+(Y-qy)*-.8)
def arm(A,hand):
    sx,sy,ex,ey,hx,hy=A;buf={}
    cap(buf,sx,sy,ex,ey,2.3,lambda a,p,l:SKIN[1] if a>UA-2.2 else ((WH[0] if l>0 else WH[1]) if (int(p+9)//2)%2==0 else BK[0]))
    cap(buf,ex,ey,hx,hy,1.7,lambda a,p,l:BAND if a>FA-2.4 else SKIN[0] if l>.5 else SKIN[1] if l>-.4 else SKIN[2])
    ux,uy=(hx-ex),(hy-ey);d=math.hypot(ux,uy) or 1;ux/=d;uy/=d
    if hand!='hide':
        cap(buf,hx,hy,hx+ux*(2.4 if hand=='palm' else 1.6),hy+uy*(2.4 if hand=='palm' else 1.6),1.9 if hand!='flat' else 1.6,lambda a,p,l:SKIN[0] if l>.4 else SKIN[1] if l>-.3 else SKIN[2])
    return buf
def stamp(img,buf):
    keys=set(buf)
    for (x,y),c in buf.items():img[y,x]=(*c,255)
    for (x,y) in keys:                                     # outline around this arm (drawn over what is behind)
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
            X,Y=x+dx,y+dy
            if 0<=X<W and 0<=Y<H and (X,Y) not in keys:img[Y,X]=(*OUT,255)
POSES={
 'incomplete':{'hands':('flat','flat'),'f':[{'r':[150,170],'l':[30,10]},{'r':[60,0],'l':[120,180],'z':'r'}]},
 'timeout':{'hands':('palm','palm'),'f':[{'r':{'h':[70,20],'e':[30,30]},'l':{'h':[58,20],'e':[98,30]},'z':'r'}]},
 'holding':{'hands':('fist','grab'),'f':[{'r':{'h':[58,50],'e':[56,80]},'l':{'grab':1,'e':[86,80]}}]},
 'safety':{'hands':('palm','palm'),'f':[{'r':{'h':[61,6],'e':[34,32]},'l':{'h':[67,6],'e':[94,32]}}]},
 'personalfoul':{'hands':('flat','flat'),'f':[{'r':{'h':[78,6],'e':[34,26]},'l':{'h':[90,-6],'e':[104,40]}},{'r':{'h':[78,6],'e':[34,26]},'l':{'h':[72,0],'e':[104,40]}}]},
 'grounding':{'hands':('flat','flat'),'f':[{'r':[-35,-35],'l':[-35,-35],'z':'r'},{'r':[145,145],'l':[145,145]}]},
 'lossofdown':{'hands':('hide','hide'),'behind':1,'f':[{'r':{'h':[54,22],'e':[26,28]},'l':{'h':[74,22],'e':[102,28]}}]},
}
pad=8;W2,H2=W+pad*2,H+pad   # room for arms reaching past the body and above the head
res={}
for name,P in POSES.items():
    frames=[]
    for fr in P['f']:
        img=np.zeros((H,W,4),np.uint8);img[:]=body
        big=np.zeros((H2,W2,4),np.uint8);big[pad:,pad:pad+W]=body
        W,H=W2,H2
        R=solve((SL[0]+pad,SL[1]+pad),fr['r'] if isinstance(fr['r'],list) else {**fr['r'],'h':[fr['r']['h'][0]+pad/.6,fr['r']['h'][1]+pad/.6],'e':[fr['r'].get('e',(64,100))[0]+pad/.6,fr['r'].get('e',(64,100))[1]+pad/.6]})
        if fr['l'].get('grab') if isinstance(fr['l'],dict) else False:
            t=.72;gx,gy=R[2]+(R[4]-R[2])*t+1.2,R[3]+(R[5]-R[3])*t
            Lsp={'h':[(gx-17.5)/.6+64,(gy-19.5)/.6+54],'e':[fr['l']['e'][0]+pad/.6,fr['l']['e'][1]+pad/.6]}
            # g2n inverse for the grab target was computed in padded space already
            Lsp['h']=[(gx-17.5)/.6+64,(gy-19.5)/.6+54]
        else:Lsp=fr['l'] if isinstance(fr['l'],list) else {**fr['l'],'h':[fr['l']['h'][0]+pad/.6,fr['l']['h'][1]+pad/.6],'e':[fr['l'].get('e',(64,100))[0]+pad/.6,fr['l'].get('e',(64,100))[1]+pad/.6]}
        Lm=solve((SR[0]+pad,SR[1]+pad),Lsp)
        order=[(Lm,P['hands'][1]),(R,P['hands'][0])] if fr.get('z')=='r' else [(R,P['hands'][0]),(Lm,P['hands'][1])]
        for A,hd in order:stamp(big,arm(A,hd))
        if P.get('behind'):
            hb=np.zeros_like(big);hb[pad:,pad:pad+head.shape[1]]=head;m=hb[...,3]>0;big[m]=hb[m]
        W,H=base.shape[1],base.shape[0]
        ys,xs=np.where(big[...,3]>0);crop=big[ys.min():ys.max()+1,xs.min():xs.max()+1]
        frames.append(crop)
    for i,fimg in enumerate(frames):Image.fromarray(fimg,'RGBA').save(f'gen_{name}_{i}.png')
    print(name,[f.shape[:2] for f in frames])
