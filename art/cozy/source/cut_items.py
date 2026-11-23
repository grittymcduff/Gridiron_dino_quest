import numpy as np
from PIL import Image
from scipy import ndimage as ndi
U='/mnt/user-data/uploads/';OUT='/home/claude/items_out'
J={
 'd753a5db':{'ball':(137,157,580,580),'bottle':(915,127,1133,611),'yflag':(1530,168,1870,570),'rflag':(188,813,528,1236),'whistle':(803,844,1245,1205),'cooler':(1499,751,1890,1297),'gold':(168,1395,539,1973)},
 '537ad846':{'chest':(147,874,528,1174),'chestgold':(587,812,1030,1174),'chestopen':(1099,782,1522,1235),'sparkle':(1600,850,1910,1185)},
 '6add0c92':{'leatherhelm':(19,109,198,282),'practicehelm':(617,109,794,313),'visorhelm':(1211,109,1389,312),'prohelm':(618,884,795,1089),'titanhelm':(1210,884,1390,1089),'goldhelm':(17,1695,191,1901),'dinocrown':(1210,1688,1382,1913)},
 'de966bec':{'jersey':(56,50,538,569),'mesh':(1255,50,1736,588),'shoulder':(19,650,576,1169),'ribs':(1227,650,1764,1197),'probowl':(57,1240,520,1797),'dinoscale':(1273,1240,1707,1788),'goldjacket':(76,1831,492,2397)},
 '4cce8ae4':{'sneakers':(702,86,891,239),'turf':(57,689,290,826),'molded':(51,1099,290,1238),'speed':(51,1497,290,1632),'raptorcleats':(41,1873,289,2013),'goldcleats':(42,2249,289,2390)},
 '7669bfb0':{'water':(239,45,457,498),'orange':(803,86,1245,457),'sports':(1601,45,1819,498),'icepack':(116,577,580,969),'hint':(854,546,1235,989),'timeout':(1591,618,1831,928),'horn':(178,1048,539,1512),'pep':(813,1048,1235,1512),'guard':(1499,1120,1911,1440),'bar':(117,1571,580,2024),'film':(833,1581,1235,2003),'coin':(1509,1591,1911,1993)},
}
def cut(sheet,box,keep_small=False):
    rgb=np.asarray(Image.open(U+sheet+'-image.jpg').convert('RGB')).astype(np.int16)
    x0,y0,x1,y1=box;p=6;crop=rgb[max(0,y0-p):y1+p,max(0,x0-p):x1+p]
    white=(crop.min(axis=2)>=200)&((crop.max(axis=2)-crop.min(axis=2))<30)
    wl,_=ndi.label(white);border=set(np.unique(np.concatenate([wl[0],wl[-1],wl[:,0],wl[:,-1]])))-{0}
    bg=np.isin(wl,list(border));halo=ndi.binary_dilation(bg,iterations=1)&(crop.min(axis=2)>185)
    a=~bg&~halo
    l,n=ndi.label(a)
    if n and not keep_small:
        s=ndi.sum(np.ones_like(l),l,range(1,n+1));a=np.isin(l,[i+1 for i,v in enumerate(s) if v>=s.max()*0.03])
    im=Image.fromarray(np.dstack([crop.astype(np.uint8),a.astype(np.uint8)*255]),'RGBA');return im.crop(im.getbbox())
def fit(im,S,crisp,margin=1,bottom=False):
    sc=min((S-2*margin)/im.width,(S-2*margin)/im.height);nw,nh=max(1,round(im.width*sc)),max(1,round(im.height*sc))
    a=np.asarray(im).astype(np.float32)/255
    pm=Image.fromarray((np.dstack([a[...,:3]*a[...,3:],a[...,3:]])*255).astype(np.uint8),'RGBA').resize((nw,nh),Image.LANCZOS)
    p=np.asarray(pm).astype(np.float32)/255;al=p[...,3:];col=np.where(al>0.02,p[...,:3]/np.maximum(al,1e-3),0)
    if crisp:
        A=al[...,0]>0.45;q=np.asarray(Image.fromarray((np.clip(col,0,1)*255).astype(np.uint8)).quantize(colors=32,method=Image.MEDIANCUT,dither=Image.NONE).convert('RGB'))
        out=np.dstack([q,A*255]).astype(np.uint8)
    else: out=(np.dstack([np.clip(col,0,1),al])*255).astype(np.uint8)
    c=np.zeros((S,S,4),np.uint8);ox=(S-nw)//2;oy=(S-nh-margin) if bottom else (S-nh)//2;c[oy:oy+nh,ox:ox+nw]=out
    return Image.fromarray(c,'RGBA')
for sheet,items in J.items():
    for name,box in items.items():
        im=cut(sheet,box,keep_small=(name=='sparkle'))
        im.save(f'{OUT}/src_{name}.png')
        if sheet=='537ad846':
            fit(im,32,True,margin=1,bottom=(name!='sparkle')).save(f'{OUT}/map_{name}.png')
        else:
            fit(im,48,False,margin=2).save(f'{OUT}/icon_{name}.png')
            if sheet=='d753a5db': fit(im,32,True,margin=1).save(f'{OUT}/held_{name}.png')
print('done')
