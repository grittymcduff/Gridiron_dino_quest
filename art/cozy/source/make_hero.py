import numpy as np, colorsys
from PIL import Image
from scipy import ndimage as ndi
import sys, os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from bgholes import bg_holes
from peel import peel
SRC=sys.argv[1];STYLE=sys.argv[2] if len(sys.argv)>2 and sys.argv[2]!='-' else '';K=int(sys.argv[3]) if len(sys.argv)>3 else 1
NAME='heroart'+('_'+STYLE if STYLE else '')+('_hi' if K>1 else '')
rgb=np.asarray(Image.open(SRC).convert('RGB')).astype(np.int16)
H,W=rgb.shape[:2];print(W,H)
ch,cw=H//4,W//3
FW,FH=40*K,48*K
frames=[]
HOLES,_=bg_holes(rgb.astype(int),dark_frac=.85)   # background trapped between legs / arm and body
def cut(cell,hole):
    white=(cell.min(axis=2)>=200)&((cell.max(axis=2)-cell.min(axis=2))<30)
    wl,_=ndi.label(white);border=set(np.unique(np.concatenate([wl[0],wl[-1],wl[:,0],wl[:,-1]])))-{0}
    bg=np.isin(wl,list(border));halo=ndi.binary_dilation(bg,iterations=2)&(cell.min(axis=2)>175)
    a=~bg&~halo&~hole;l,n=ndi.label(a)
    if n:s=ndi.sum(np.ones_like(l),l,range(1,n+1));a=np.isin(l,[i+1 for i,v in enumerate(s) if v>=s.max()*0.02])
    return a
cells=[];hmax=0
for r in range(4):
    for c in range(3):
        cell=rgb[r*ch:(r+1)*ch,c*cw:(c+1)*cw];a=cut(cell,HOLES[r*ch:(r+1)*ch,c*cw:(c+1)*cw]);ys,xs=np.where(a)
        cells.append((cell,a,ys.min(),ys.max(),xs.min(),xs.max()));hmax=max(hmax,ys.max()-ys.min()+1)
# the sheet's left-facing walk frame (row 3, col 3) actually faces right: use the mirrored right-facing one instead
_cell,_a=cells[11][0][:, ::-1].copy(),cells[11][1][:, ::-1].copy();_ys,_xs=np.where(_a)
cells[8]=(_cell,_a,_ys.min(),_ys.max(),_xs.min(),_xs.max())
# one scale for all frames (so the character doesn't change size between frames): tallest frame -> 45 px
sc=45*K/hmax;print('scale',sc,'hmax',hmax)
sheet=np.zeros((FH*4,FW*3,4),np.uint8);PAPER=np.zeros((FH*4,FW*3),bool)
for i,(cell,a,y0,y1,x0,x1) in enumerate(cells):
    r,c=divmod(i,3)
    # anchor: feet bottom, horizontal center of the body (use center of mass to avoid held items skewing)
    cy,cx=ndi.center_of_mass(a)
    crop=np.dstack([cell.astype(np.uint8),a.astype(np.uint8)*255])
    im=Image.fromarray(crop,'RGBA')
    nw,nh=round(cell.shape[1]*sc),round(cell.shape[0]*sc)
    f=np.asarray(im).astype(np.float32)/255
    pm=Image.fromarray((np.dstack([f[...,:3]*f[...,3:],f[...,3:]])*255).astype(np.uint8),'RGBA').resize((nw,nh),Image.BOX)
    p=np.asarray(pm).astype(np.float32)/255;al=p[...,3:];col=np.where(al>0.02,p[...,:3]/np.maximum(al,1e-3),0)
    A=al[...,0]>0.5
    q=np.asarray(Image.fromarray((np.clip(col,0,1)*255).astype(np.uint8)).quantize(colors=40 if K==1 else 72,method=Image.MEDIANCUT,dither=Image.NONE).convert('RGB'))
    full=np.dstack([q,A*255]).astype(np.uint8)
    # clipboard paper, found at full size where its warm cream color is clear (the shirt is a cool gray)
    ci=cell.astype(int);pap=a&(ci.mean(axis=2)>165)&((ci[...,2]-ci[...,0])<=0)&((ci.max(axis=2)-ci.min(axis=2))<50)
    papS=np.asarray(Image.fromarray((pap*255).astype(np.uint8)).resize((nw,nh),Image.BOX))>90
    # place: feet (y1) at FH-2, center x at FW/2
    oy=round((FH-2*K)-(y1+1)*sc);ox=round(FW/2-cx*sc)
    dst=sheet[r*FH:(r+1)*FH,c*FW:(c+1)*FW]
    for yy in range(nh):
        ty=oy+yy
        if ty<0 or ty>=FH:continue
        for xx in range(nw):
            tx=ox+xx
            if 0<=tx<FW and full[yy,xx,3]:dst[ty,tx]=full[yy,xx];PAPER[r*FH+ty,c*FW+tx]=papS[yy,xx]
raw=sheet

s=raw.copy()
out=s.copy();mask=np.zeros(s.shape[:2],np.uint8)
for r in range(4):
  for c in range(3):
    f=out[r*FH:(r+1)*FH,c*FW:(c+1)*FW]
    A=f[...,3]>0
    ring=ndi.binary_dilation(A)&~A
    f[ring]=[36,22,15,255]
    ys,xs=np.where(A);top,bot=ys.min(),ys.max();hgt=bot-top+1
    m=mask[r*FH:(r+1)*FH,c*FW:(c+1)*FW]
    for y,x in zip(ys,xs):
        R,G,B=f[y,x,:3]/255.0;h,l,sat=colorsys.rgb_to_hls(R,G,B);h*=360;t=(y-top)/hgt
        role=0
        if 40<=h<=65 and sat>.12 and l>.72: role=0            # clipboard paper
        elif t<.48 and 5<=h<=45 and sat>.25 and l<.42: role=1  # hair
        elif 8<=h<=45 and sat>.22 and l>=.47: role=2           # skin (face, arms, legs)
        elif .3<=t<=.78 and l>=.5 and (sat<.22 or 190<=h<=250): role=3   # shirt
        elif .55<=t<=.9 and l<.32 and (185<=h<=265 or sat<.15): role=4                       # shorts
        elif t>.86 and l<.65 and not (8<=h<=45 and sat>.22): role=5     # shoes
        if t<.48 and role==0 and 5<=h<=45 and sat>.25 and l<.47: role=1
        m[y-0,x]=role
    # very light pixels with no blue tint are clipboard paper even where it touches the shirt
    m[(m==3)&PAPER[r*FH:(r+1)*FH,c*FW:(c+1)*FW]]=0
    # shirt = the largest connected shirt area only; separate light pieces (the clipboard paper) keep their colors
    sh=(m==3);lab,n=ndi.label(sh)
    if n>1:
        sz=ndi.sum(sh,lab,range(1,n+1));big=1+int(np.argmax(sz));fr=f[...,:3].astype(int)
        for i in range(1,n+1):
            if i==big:continue
            if (lab==i).sum()<6*K: m[lab==i]=0;continue   # specks on the clipboard grid / football laces
            px=fr[lab==i];
            if px[:,2].mean()-px[:,0].mean()<6: m[lab==i]=0   # neutral/warm = clipboard paper; bluish = shirt seen past the arm
            ringi=ndi.binary_dilation(lab==i,iterations=2)&~(lab==i)&(f[...,3]>0)
            if ringi.sum() and (m[ringi]==2).mean()>.5: m[lab==i]=0   # mostly wrapped in skin = an item held in the hand
Image.fromarray(out,'RGBA').save(NAME+'.png')
Image.fromarray(np.dstack([mask*40,mask*40,mask*40,(out[...,3]>0)*255]).astype(np.uint8),'RGBA').save(NAME+'_mask.png')

print('wrote',NAME+'.png and',NAME+'_mask.png')
print('fringe peeled:',peel(NAME+'.png',K))
