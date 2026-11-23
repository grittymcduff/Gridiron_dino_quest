import numpy as np, colorsys, json
from PIL import Image
from scipy import ndimage as ndi
FR='/home/claude/dino_frames';OUT='/home/claude/dino_out'
import os;os.makedirs(OUT,exist_ok=True)
W,H=232,200
POSE={'ptero':'r3c3'}
# role rules: (role, hue_lo, hue_hi, sat_min, light_lo, light_hi)   role: 1 body 2 belly 3 accent 4 claws/horns
RULES={
 'ptero':[(2,8,40,.30,.62,1.0),(1,0,40,.30,0,.62),(1,340,360,.30,0,.62)],
 'ankylo':[(4,25,60,.12,.55,1.0),(1,20,70,.10,0,.55)],
 'stego':[(3,0,30,.45,0,1),(3,345,360,.45,0,1),(4,30,55,.10,.62,1.0),(2,22,50,.30,.25,.62),(1,70,160,.15,0,1)],
 'rex':[(2,50,88,.15,0,1),(1,88,165,.15,0,1)],
 'trike':[(4,25,60,.10,.45,1.0),(1,70,160,.12,0,1)],
 'raptor':[(4,40,75,.05,.68,1.0),(1,130,200,.15,0,1)],
 'sauro':[(2,40,110,.06,.58,1.0),(1,40,110,.10,0,.58)],
 'pachy':[(4,25,55,.10,.55,1.0),(2,25,55,.15,.35,.55),(1,70,160,.12,0,1)],
}
def shrink(img):
    sc=min((W-4)/img.width,(H*0.88)/img.height)
    nw,nh=round(img.width*sc),round(img.height*sc)
    a=np.asarray(img).astype(np.float32)/255
    pm=Image.fromarray((np.dstack([a[...,:3]*a[...,3:],a[...,3:]])*255).astype(np.uint8),'RGBA').resize((nw,nh),Image.LANCZOS)
    p=np.asarray(pm).astype(np.float32)/255;al=p[...,3:]
    col=np.where(al>0.02,p[...,:3]/np.maximum(al,1e-3),0);A=al[...,0]>0.5
    small=Image.fromarray((np.clip(col,0,1)*255).astype(np.uint8),'RGB')
    q=np.asarray(small.quantize(colors=64,method=Image.MEDIANCUT,dither=Image.NONE).convert('RGB')).copy()
    pad=np.zeros((nh+2,nw+2),bool);pad[1:-1,1:-1]=A
    ring=ndi.binary_dilation(pad)&~pad
    tmp=np.zeros((nh+2,nw+2,4),np.uint8);tmp[1:-1,1:-1,:3]=q;tmp[1:-1,1:-1,3]=A*255;tmp[ring]=[36,22,15,255]
    canvas=np.zeros((H,W,4),np.uint8);ox=(W-nw-2)//2;oy=H-nh-2
    canvas[oy:oy+nh+2,ox:ox+nw+2]=tmp
    return canvas
def roles(fam,cv):
    m=np.zeros(cv.shape[:2],np.uint8)
    rgb=cv[...,:3].astype(np.float32)/255
    for y,x in zip(*np.where(cv[...,3]>0)):
        r,g,b=rgb[y,x];h,l,s=colorsys.rgb_to_hls(r,g,b);h*=360
        if max(r,g,b)<0.13:continue  # outline / near-black
        for role,h0,h1,smin,l0,l1 in RULES[fam]:
            if h0<=h<h1 and s>=smin and l0<=l<l1: m[y,x]=role;break
    # clean speckle: a role pixel surrounded mostly by non-role pixels is dropped
    return m
cols=np.array([[0,0,0,0],[220,60,60,255],[60,200,90,255],[70,110,230,255],[230,210,60,255]],np.uint8)
dbg=[]
for fam in RULES:
    img=Image.open(f"{FR}/{fam}_{POSE.get(fam,'r3c1')}.png")
    cv=shrink(img);m=roles(fam,cv)
    Image.fromarray(cv,'RGBA').save(f'{OUT}/dino_{fam}.png')
    Image.fromarray(np.dstack([m*60,m*60,m*60,(cv[...,3]>0)*255]).astype(np.uint8),'RGBA').save(f'{OUT}/dino_{fam}_mask.png')
    over=cv.copy();sel=m>0;over[sel]=(cv[sel]*0.35+cols[m[sel]]*0.65).astype(np.uint8)
    dbg.append((cv,over))
S=2;o=Image.new('RGBA',(len(dbg)*(W*S+6),2*H*S+6),(250,250,250,255))
for i,(a,b) in enumerate(dbg):
    o.alpha_composite(Image.fromarray(a).resize((W*S,H*S),Image.NEAREST),(i*(W*S+6),0))
    o.alpha_composite(Image.fromarray(b).resize((W*S,H*S),Image.NEAREST),(i*(W*S+6),H*S+6))
o.save('/home/claude/tools/roles_dbg.png');print('ok')
