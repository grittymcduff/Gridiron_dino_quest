# Remove the light JPG fringe left between a sprite's art and its outer outline.
# Strips the added outline, peels light, low-color pixels off the outer edge (up to N px, stopping at the
# art's own dark outline), then re-adds a 1 px dark outline.  Usage: python3 peel.py N file.png [file.png ...]
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
OUT=np.array([36,22,15])
def peel(path,N):
    a=np.array(Image.open(path).convert('RGBA'));A=a[...,3]>0;rgb=a[...,:3].astype(int)
    isout=A&(np.abs(rgb-OUT).sum(axis=2)<6)
    A&=~(isout&ndi.binary_dilation(~A))            # drop the added outline
    lum=rgb.mean(axis=2);chroma=rgb.max(axis=2)-rgb.min(axis=2)
    light=(lum>135)&(chroma<70)
    removed=0
    for _ in range(N):
        edge=A&ndi.binary_dilation(~A)&light
        if not edge.any():break
        A&=~edge;removed+=int(edge.sum())
    ring=ndi.binary_dilation(A)&~A
    a[~A]=0;a[ring]=[36,22,15,255]
    Image.fromarray(a).save(path);return removed
if __name__=='__main__':
    N=int(sys.argv[1])
    for f in sys.argv[2:]:print(f.split('/')[-1],peel(f,N))
