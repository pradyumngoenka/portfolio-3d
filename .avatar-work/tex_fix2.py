import numpy as np
from PIL import Image
from scipy import ndimage
t = np.asarray(Image.open('/tmp/tex_orig.png').convert('RGB'), dtype=np.float32)/255.0
H,W,_ = t.shape
mx=t.max(2); mn=t.min(2); lum=t.mean(2)
dark_neutral = (lum<0.25) & ((mx-mn)<0.10)
lab,n = ndimage.label(dark_neutral)
sizes = ndimage.sum(dark_neutral, lab, range(1,n+1))
bg = lab==(int(np.argmax(sizes))+1)
ys,xs = np.mgrid[0:H,0:W]
# real skin reference: cheek x 620-700, y 480-520
cheek = (xs>=620)&(xs<=700)&(ys>=480)&(ys<=520)&(t[...,0]>0.85)
skinref = np.median(t[cheek],axis=0); slum = lum[cheek].mean()
print('skinref:', skinref.round(3), 'n=', int(cheek.sum()))
out = t.copy()
r,g,b = t[...,0],t[...,1],t[...,2]
# 1) stubble block: warm but darker than skin
box1 = (xs>=568)&(xs<=618)&(ys>=452)&(ys<=568)
stub = box1 & ((r-g)>0.12) & ((r-b)>0.15) & (r<0.87) & (r>0.35)
print('stubble texels:', int(stub.sum()))
f = np.clip(lum[stub]/slum, 0.72, 1.0)
for c in range(3): out[...,c][stub] = skinref[c]*f
# 2) under-chin black blob: bg-classified texels in chin box -> shadowed skin
box2 = (xs>=550)&(xs<=770)&(ys>=555)&(ys<=700)
blob = box2 & bg
print('blob texels:', int(blob.sum()))
for c in range(3): out[...,c][blob] = skinref[c]*0.62
# 3) edge padding in head box, 6 passes
head = np.zeros((H,W),bool); head[230:780,470:1020]=True
nb_mask = ~bg  # non-bg from ORIGINAL classification + freshly painted texels count as content
painted = stub | blob
content = (~bg) | painted
bgm = bg & head & ~painted
ones3 = np.ones((3,3),int)
for it in range(6):
    nbc = ndimage.convolve(content.astype(np.int32), ones3, mode='constant') - content.astype(np.int32)
    fill = bgm & (nbc>0)
    if not fill.any(): break
    for c in range(3):
        s = ndimage.convolve(np.where(content,out[...,c],0), ones3, mode='constant')
        out[...,c][fill] = s[fill]/nbc[fill]
    bgm &= ~fill; content |= fill
print('padding done')
Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8)).save('/tmp/tex_clean.png')
Image.open('/tmp/tex_clean.png').crop((480,240,880,680)).resize((800,880), Image.NEAREST).save('/tmp/tex_face_crop2.png')
print('saved')
