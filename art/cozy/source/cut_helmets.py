import numpy as np
from PIL import Image
from scipy import ndimage as ndi
rgb=np.asarray(Image.open('/mnt/user-data/uploads/6add0c92-image.jpg').convert('RGB')).astype(np.int16)
nw=rgb.min(axis=2)<215
lab,n=ndi.label(ndi.binary_dilation(nw,iterations=4));objs=ndi.find_objects(lab)
def comp_at(x0,y0):
    for i,s in enumerate(objs):
        if abs(s[1].start-x0)<4 and abs(s[0].start-y0)<4: return s
    raise Exception((x0,y0))
PICK={ # down, up, left, right  (top-left corners from the component list)
 'leatherhelm':[(19,109),(216,575),(14,573),(403,109)],
 'practicehelm':[(617,109),(811,576),(614,573),(999,109)],
 'visorhelm':[(1211,109),(1407,575),(1205,573),(1594,109)],
 'prohelm':[(618,884),(812,1405),(611,1405),(998,884)],
 'titanhelm':[(1210,884),(1407,1406),(1206,1405),(1594,884)],
 'goldhelm':[(17,1695),(218,2201),(5,2202),(416,1695)],
 'dinocrown':[(1407,1702),(1407,1702),(1407,1702),(1407,1702)],
}
OUT='/home/claude/hero'
for hid,picks in PICK.items():
    for d,(x0,y0) in zip(['down','up','left','right'],picks):
        s=comp_at(x0,y0);cell=rgb[max(0,s[0].start-4):s[0].stop+4,max(0,s[1].start-4):s[1].stop+4]
        white=(cell.min(axis=2)>=200)&((cell.max(axis=2)-cell.min(axis=2))<30)
        wl,k=ndi.label(white);border=set(np.unique(np.concatenate([wl[0],wl[-1],wl[:,0],wl[:,-1]])))-{0}
        bg=np.isin(wl,list(border))
        Wd=cell.shape[1]
        # enclosed white areas that are big and wide = the face opening / ear hole -> see-through
        # only front views have a face opening: the big enclosed white area in the lower middle
        if d=='down':
            Ht=cell.shape[0]
            for i in range(1,k+1):
                if i in border:continue
                m=wl==i;ys,xs=np.where(m)
                if m.sum()>0.02*Ht*Wd and ys.mean()>Ht*0.5 and abs(xs.mean()-Wd/2)<Wd*0.15 and min(np.ptp(xs),np.ptp(ys))>0.18*Wd: bg|=m
        halo=ndi.binary_dilation(bg,iterations=1)&(cell.min(axis=2)>185)
        a=~bg&~halo;l,nn=ndi.label(a)
        if nn:ss=ndi.sum(np.ones_like(l),l,range(1,nn+1));a=np.isin(l,[i+1 for i,v in enumerate(ss) if v>=ss.max()*0.03])
        im=Image.fromarray(np.dstack([cell.astype(np.uint8),a.astype(np.uint8)*255]),'RGBA');im=im.crop(im.getbbox())
        if hid=='practicehelm' and d=='left': im=im.transpose(Image.FLIP_LEFT_RIGHT)  # this view faces right in the sheet
        im.save(f'{OUT}/src_helm_{hid}_{d}.png')
print('ok')
