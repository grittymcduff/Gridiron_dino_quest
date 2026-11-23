import numpy as np
from PIL import Image
from scipy import ndimage as ndi
def bg_holes(rgb,min_px=40,dark_frac=.8):
    w=(rgb.min(axis=2)>=238)&((rgb.max(axis=2)-rgb.min(axis=2))<22)
    lab,n=ndi.label(w);border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))
    holes=np.zeros(w.shape,bool);info=[]
    lum=rgb.mean(axis=2)
    for i,s in enumerate(ndi.find_objects(lab)):
        if i+1 in border:continue
        y0,y1,x0,x1=max(0,s[0].start-4),s[0].stop+4,max(0,s[1].start-4),s[1].stop+4
        m=lab[y0:y1,x0:x1]==i+1
        if m.sum()<min_px:continue
        ring=ndi.binary_dilation(m,iterations=3)&~ndi.binary_dilation(m,iterations=1)
        # ignore the soft light transition: judge by the pixels 2-3 px away
        f=(lum[y0:y1,x0:x1][ring]<90).mean()
        info.append((int(m.sum()),round(float(f),2),(x0,y0)))
        if f>=dark_frac:holes[y0:y1,x0:x1]|=ndi.binary_dilation(m,iterations=2)&(rgb[y0:y1,x0:x1].min(axis=2)>150)
    return holes,info
if __name__=='__main__':
    rgb=np.asarray(Image.open('/mnt/user-data/uploads/20f239dc-image.jpg').convert('RGB')).astype(int)
    h,info=bg_holes(rgb)
    for x in sorted(info,key=lambda t:-t[1]): print(x)
