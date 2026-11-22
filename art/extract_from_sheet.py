import numpy as np, json, base64, io
from PIL import Image
from scipy import ndimage
SRC=np.array(Image.open('sheet.png').convert('RGB')).astype(float)
PICK={'trike':(563,42,176,120),'spino':(788,46,233,134),'stego':(558,469,185,124),'ankylo':(37,494,197,95),'rex':(784,694,230,107)}
SCALE=0.475   # same for every family -> true relative sizes; widest (spino) ~ 110px
OUT=np.array([0x1a,0x12,0x30])
res={}
for fam,(x,y,w,h) in PICK.items():
    m=6;crop=SRC[y-m:y+h+m,x-m:x+w+m]
    lum=crop.mean(2);sat=crop.max(2)-crop.min(2)
    bgish=(lum>178)&(sat<28)
    lab,_=ndimage.label(bgish)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    # also kill the thin grey grid lines that touch the dino
    alpha=(~bg).astype(float)
    alpha=ndimage.binary_opening(alpha>0,structure=np.ones((2,2))).astype(float)
    # fill only tiny holes (specks); keep real gaps such as between legs
    holes=ndimage.binary_fill_holes(alpha>0)&~(alpha>0);hl,hn=ndimage.label(holes)
    for k in range(1,hn+1):
        reg=hl==k
        if reg.sum()<40: alpha[reg]=1
    # enclosed light-grey background pockets -> transparent
    pocket=(alpha>0)&(lum>200)&(sat<20);pl,pn=ndimage.label(pocket)
    for k in range(1,pn+1):
        reg=pl==k
        if reg.sum()>=25: alpha[reg]=0
    W=max(1,round(crop.shape[1]*SCALE));H=max(1,round(crop.shape[0]*SCALE))
    # premultiplied box downsample
    rgb=Image.fromarray(np.uint8(np.clip(crop*alpha[...,None],0,255)));a=Image.fromarray(np.uint8(alpha*255))
    rgbS=np.array(rgb.resize((W,H),Image.BOX)).astype(float);aS=np.array(a.resize((W,H),Image.BOX)).astype(float)/255
    keep=aS>0.5
    lumS=rgbS.mean(2)/np.maximum(aS,1e-3);satS=(rgbS.max(2)-rgbS.min(2))/np.maximum(aS,1e-3)
    edge=keep&~ndimage.binary_erosion(keep,iterations=2)
    keep=keep&~(edge&(lumS>165)&(satS<30))
    col=np.where(keep[...,None],rgbS/np.maximum(aS,1e-3)[...,None],0)
    # palette-quantize the body for a crisp pixel-art look
    im=Image.fromarray(np.uint8(np.clip(col,0,255)))
    q=np.array(im.quantize(colors=22,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB')).astype(int)
    # trim
    ys,xs=np.where(keep);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    keep=keep[y0:y1,x0:x1];q=q[y0:y1,x0:x1]
    # 1px game outline + darken the silhouette's inner edge a touch
    H2,W2=keep.shape;out=np.zeros((H2+2,W2+2,4),np.uint8)
    out[1:-1,1:-1,:3]=q;out[1:-1,1:-1,3]=keep*255
    pad=np.pad(keep,1);ring=ndimage.binary_dilation(pad,structure=[[0,1,0],[1,1,1],[0,1,0]])&~pad
    out[ring,:3]=OUT;out[ring,3]=255
    img=Image.fromarray(out,'RGBA');img.save(f'{fam}.png')
    buf=io.BytesIO();img.save(buf,'PNG',optimize=True);res[fam]='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()
    print(fam,img.size,len(buf.getvalue()),'bytes')
json.dump(res,open('dino_art.json','w'))
