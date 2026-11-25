# Cut the legend/dummy sprites from Tim's two sheets: remove the white background, flip to face left,
# fit into the 232x200 boss frame like the Head Coach art (max 230 wide x 178 tall, bottom-aligned, centered, 50 colors).
import sys
from PIL import Image, ImageFilter
from collections import deque
import numpy as np
A='/mnt/user-data/uploads/37dd16f3-image.jpg'; Bp='/mnt/user-data/uploads/3ca738e9-image.jpg'
def alpha_mask(im,tol=38):
    a=np.asarray(im.convert('RGB')).astype(int);H,W,_=a.shape
    bg=(np.abs(a-255).max(axis=2)<=tol)  # near-white
    seen=np.zeros((H,W),bool);q=deque()
    for x in range(W):
        for y in (0,H-1):
            if bg[y,x] and not seen[y,x]:seen[y,x]=1;q.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if bg[y,x] and not seen[y,x]:seen[y,x]=1;q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<H and 0<=nx<W and bg[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;q.append((ny,nx))
    return ~seen
def components(mask):
    H,W=mask.shape;lab=np.zeros((H,W),int);n=0;boxes=[]
    for y in range(H):
        for x in range(W):
            if mask[y,x] and not lab[y,x]:
                n+=1;q=deque([(y,x)]);lab[y,x]=n;x0=x1=x;y0=y1=y;c=0
                while q:
                    cy,cx=q.popleft();c+=1;x0=min(x0,cx);x1=max(x1,cx);y0=min(y0,cy);y1=max(y1,cy)
                    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
                        ny,nx=cy+dy,cx+dx
                        if 0<=ny<H and 0<=nx<W and mask[ny,nx] and not lab[ny,nx]:lab[ny,nx]=n;q.append((ny,nx))
                boxes.append((c,x0,y0,x1+1,y1+1,n))
    return lab,boxes
out={}
for path,regions in [(A,[('coach_hoodosaurus',(0,0,1024,1100),True),('coach_iron_sweep',(1024,0,2048,1100),False),('coach_mustachiodon',(0,1100,2048,2048),True)]),
                     (Bp,[('the_big_tunasaurus',(0,400,560,1300),True),('coach_clockwatcher',(560,400,900,1300),True),('the_goat_osaurus',(900,400,1250,1300),True),
                          ('tackle_dummy_raptor',(1250,400,1560,1300),True),('film_room_dummy_stego',(1560,400,2048,1300),True)])]:
    im=Image.open(path).convert('RGB');
    if path==Bp: im=im.crop((0,0,2048,1370))  # drop the name labels (they start around y~1380 at full size)
    mask=alpha_mask(im)
    lab,boxes=components(mask)
    for name,(rx0,ry0,rx1,ry1),flip in regions:
        # keep components whose center falls in this region and that are big enough (drops JPEG specks)
        keep=[b for b in boxes if b[0]>400 and rx0<= (b[1]+b[3])/2 <rx1 and ry0<=(b[2]+b[4])/2<ry1]
        ids=set(b[5] for b in keep);m=np.isin(lab,list(ids))
        ys,xs=np.where(m);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
        rgba=np.dstack([np.asarray(im)[y0:y1,x0:x1],(m[y0:y1,x0:x1]*255).astype(np.uint8)])
        spr=Image.fromarray(rgba,'RGBA')
        if flip: spr=spr.transpose(Image.FLIP_LEFT_RIGHT)
        out[name]=spr;print(name,'src',spr.size,'parts',len(keep))
def fit(spr):
    w,h=spr.size;s=min(230/w,178/h);nw,nh=max(1,round(w*s)),max(1,round(h*s))
    # premultiplied downscale so edges don't pick up white
    a=np.asarray(spr).astype(float);al=a[...,3:]/255;pm=np.concatenate([a[...,:3]*al,a[...,3:]],2).astype(np.uint8)
    sm=Image.fromarray(pm,'RGBA').resize((nw,nh),Image.BOX);b=np.asarray(sm).astype(float)
    al=b[...,3:]/255;rgb=np.where(al>0,b[...,:3]/np.maximum(al,1e-6),0)
    keep=(b[...,3]>=128);rgb=np.clip(rgb,0,255).astype(np.uint8)
    canvas=Image.new('RGBA',(232,200),(0,0,0,0));tile=Image.fromarray(np.dstack([rgb,(keep*255).astype(np.uint8)]),'RGBA')
    # 50-color palette like the other boss art
    q=tile.convert('RGB').quantize(50,method=Image.Quantize.MEDIANCUT).convert('RGB');tile=Image.merge('RGBA',(*q.split(),tile.getchannel('A')))
    canvas.alpha_composite(tile,((232-nw)//2,200-nh));return canvas
for k,v in out.items():
    fit(v).save(f'/home/claude/legends/work/boss_{k}.png')
