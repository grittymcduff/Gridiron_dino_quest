import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as ndi
OUT='/home/claude/boss_in'
W,H=232,200   # 2x the 116x100 spec -> drawn 1:1 in battle
jobs={
 '/mnt/user-data/uploads/ecca7808-image.jpg':[('captain_longneck',16,True),('scout_raptor',696,True),('referee_rex',1325,True)],
 '/mnt/user-data/uploads/3604c3af-image.jpg':[('groundskeeper_stego',(90,70),False),('coordinator_ankylo',(1053,131),False),('curator_trike',(69,1268),False),('commissioner_spino',(1022,1165),False)],
}
for path,items in jobs.items():
    rgb=np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    nonwhite=rgb.min(axis=2)<225
    lab,n=ndi.label(ndi.binary_dilation(nonwhite,iterations=12))
    objs=ndi.find_objects(lab)
    for name,key,flip in items:
        # pick component by its left x (or left,top)
        best=None
        for i,s in enumerate(objs):
            x0,y0=s[1].start,s[0].start
            if isinstance(key,tuple):
                if abs(x0-key[0])<3 and abs(y0-key[1])<3: best=i
            elif abs(x0-key)<3 and (lab[s]==i+1).sum()>20000: best=i
        s=objs[best];comp=(lab[s]==best+1)
        crop=rgb[s].copy()
        # background = near-white connected to the crop border (or outside this component)
        white=(crop.min(axis=2)>=200)&((crop.max(axis=2)-crop.min(axis=2))<30)
        wl,_=ndi.label(white)
        border=set(np.unique(np.concatenate([wl[0],wl[-1],wl[:,0],wl[:,-1]])))-{0}
        bg=np.isin(wl,list(border))|~comp
        alpha=(~bg).astype(np.uint8)*255
        # drop the light halo the JPEG leaves around the outline
        halo=ndi.binary_dilation(bg,iterations=2)&(crop.min(axis=2)>170)
        alpha[halo]=0
        alpha=ndi.binary_fill_holes(alpha>0)&~bg|((alpha>0))
        alpha=(alpha&~halo).astype(np.uint8)*255
        img=Image.fromarray(np.dstack([crop.astype(np.uint8),alpha]),'RGBA')
        bb=img.getbbox();img=img.crop(bb)
        if flip: img=img.transpose(Image.FLIP_LEFT_RIGHT)
        sc=min((W-4)/img.width,(H*0.88)/img.height)
        nw,nh=max(1,round(img.width*sc)),max(1,round(img.height*sc))
        # premultiplied downscale so edges don't pick up white
        a=np.asarray(img).astype(np.float32)/255
        pm=Image.fromarray((np.dstack([a[...,:3]*a[...,3:],a[...,3:]])*255).astype(np.uint8),'RGBA').resize((nw,nh),Image.LANCZOS)
        p=np.asarray(pm).astype(np.float32)/255;al=p[...,3:]
        col=np.where(al>0.02,p[...,:3]/np.maximum(al,1e-3),0)
        A=(al[...,0]>0.5)
        small=Image.fromarray((np.dstack([np.clip(col,0,1)*255,A*255])).astype(np.uint8),'RGBA')
        # crisp pixel-art finish: limit palette, then 1px dark outline where the edge is soft
        q=small.convert('RGB').quantize(colors=48,method=Image.MEDIANCUT,dither=Image.NONE).convert('RGB')
        qa=np.dstack([np.asarray(q),A.astype(np.uint8)*255])
        edge=ndi.binary_dilation(A)&~A
        qa[edge]=[36,22,15,255]
        canvas=np.zeros((H,W,4),np.uint8)
        ox=(W-nw-2)//2+1;oy=H-nh-1
        canvas[oy-1:oy+nh+1,ox-1:ox+nw+1][:]=0
        tmp=np.zeros((nh+2,nw+2,4),np.uint8);tmp[1:-1,1:-1]=qa
        e2=ndi.binary_dilation(A,iterations=1,structure=np.ones((3,3)))
        pad=np.zeros((nh+2,nw+2),bool);pad[1:-1,1:-1]=A
        ring=ndi.binary_dilation(pad)&~pad
        tmp[ring]=[36,22,15,255]
        canvas[oy-1:oy+nh+1,ox-1:ox+nw+1]=tmp
        Image.fromarray(canvas,'RGBA').save(f'{OUT}/boss_{name}.png')
        print(name,(nw,nh),'flip' if flip else '')
