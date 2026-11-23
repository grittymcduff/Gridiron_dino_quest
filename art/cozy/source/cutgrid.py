# Cut every figure of a 3x4 sheet by its own outline (not by the grid), so nothing is clipped.
import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi
def cut_sheet(path,rows=4,cols=3,report=''):
    rgb=np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    H,W=rgb.shape[:2];ch,cw=H/rows,W/cols
    white=(rgb.min(axis=2)>=200)&((rgb.max(axis=2)-rgb.min(axis=2))<30)
    wl,_=ndi.label(white);border=set(np.unique(np.concatenate([wl[0],wl[-1],wl[:,0],wl[:,-1]])))-{0}
    bg=np.isin(wl,list(border))
    # big white areas that connect to the outside through gaps between figures are background too
    fg=~bg
    lab,n=ndi.label(ndi.binary_dilation(fg,iterations=2))
    sizes=ndi.sum(fg,lab,range(1,n+1));coms=ndi.center_of_mass(fg,lab,range(1,n+1));objs=ndi.find_objects(lab)
    cells={(r,c):[] for r in range(rows) for c in range(cols)}
    for i in range(n):
        if sizes[i]<40:continue
        cy,cx=coms[i];r,c=min(rows-1,int(cy//ch)),min(cols-1,int(cx//cw));cells[(r,c)].append(i+1)
    out={}
    for (r,c),ids in cells.items():
        if not ids:continue
        main=max(ids,key=lambda k:sizes[k-1])
        keep=[k for k in ids if sizes[k-1]>=sizes[main-1]*0.02]
        m=np.isin(lab,keep)&fg
        halo=ndi.binary_dilation(~fg,iterations=2)&(rgb.min(axis=2)>175)
        a=m&~halo
        ys,xs=np.where(a);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        # sanity: report figures that reach well past their own cell (possible merge with a neighbor)
        if x0<c*cw-cw*.35 or x1>(c+1)*cw+cw*.35 or y0<r*ch-ch*.35 or y1>(r+1)*ch+ch*.35: print(report,'wide figure',r+1,c+1,(x0,y0,x1,y1))
        img=np.dstack([rgb[y0:y1,x0:x1].astype(np.uint8),(a[y0:y1,x0:x1]*255).astype(np.uint8)])
        out[(r+1,c+1)]=Image.fromarray(img,'RGBA')
    return out
if __name__=='__main__':
    SRC={'ptero':'dab42592','ankylo':'06ff8e2c','pachy':'2d6f9ae5','stego':'ff377408','rex':'61d0be89','trike':'2141e7ea','raptor':'83131ab7','sauro':'4a264b00'}
    for fam,f in SRC.items():
        fr=cut_sheet(f'/mnt/user-data/uploads/{f}-image.jpg',report=fam)
        print(fam,len(fr),'frames')
        for (r,c),im in fr.items(): im.save(f'/home/claude/dino_frames/{fam}_r{r}c{c}.png')
