import bpy, bmesh
import numpy as np
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='/tmp/man-clean4.glb')
ob=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name=='char1'][0]
mat=ob.data.materials[0]
texnode=None
for n in mat.node_tree.nodes:
    if n.type=='TEX_IMAGE' and n.image: texnode=n; break
img=texnode.image
W,H=img.size
PX=np.array(img.pixels[:],dtype=np.float32).reshape(H,W,4)
bm=bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
uvl=bm.loops.layers.uv.active
def ftex(f):
    u=sum(l[uvl].uv.x for l in f.loops)/len(f.loops); v=sum(l[uvl].uv.y for l in f.loops)/len(f.loops)
    x=min(max(int(u*W),0),W-1); y=min(max(int(v*H),0),H-1)
    return PX[y,x,:3]
olive=[]; dark_faces=[]
for f in bm.faces:
    p=f.calc_center_median()
    if not (60<p.z<148): continue
    r,g,b=ftex(f); lum=(r+g+b)/3
    if r>=g>=b and (g-b)>0.06:
        if 0.27<lum<0.50 and (r-g)<0.10:
            olive.append((r,g,b))
        elif lum<=0.30:
            dark_faces.append(f)
olive=np.median(np.array(olive),axis=0); olum=olive.mean()
print("olive ref:",olive.round(3),"dark jacket faces:",len(dark_faces))
T=PX[:,:,:3].copy()
painted=0; skipped_seam=0
def paint_tri(p0,p1,p2):
    global painted, skipped_seam
    xs=[p0[0],p1[0],p2[0]]; ys=[p0[1],p1[1],p2[1]]
    if max(xs)-min(xs)>60 or max(ys)-min(ys)>60:
        skipped_seam+=1; return
    x0=max(0,int(min(xs))); x1=min(W-1,int(max(xs))+1)
    y0=max(0,int(min(ys))); y1=min(H-1,int(max(ys))+1)
    if x1<=x0 or y1<=y0: return
    d=(p1[1]-p2[1])*(p0[0]-p2[0])+(p2[0]-p1[0])*(p0[1]-p2[1])
    if abs(d)<1e-9: return
    gx,gy=np.meshgrid(np.arange(x0,x1+1)+0.5, np.arange(y0,y1+1)+0.5)
    w0=((p1[1]-p2[1])*(gx-p2[0])+(p2[0]-p1[0])*(gy-p2[1]))/d
    w1=((p2[1]-p0[1])*(gx-p2[0])+(p0[0]-p2[0])*(gy-p2[1]))/d
    w2=1-w0-w1
    m=(w0>=-0.05)&(w1>=-0.05)&(w2>=-0.05)
    if not m.any(): return
    yy,xx=np.where(m)
    ya=yy+y0; xa=xx+x0
    px=T[ya,xa]; lum=px.mean(1)
    dk = lum<0.32
    if not dk.any(): return
    ya=ya[dk]; xa=xa[dk]; lum=lum[dk]
    fac=np.clip(lum/olum,0.55,1.15)
    T[ya,xa]=olive*fac[:,None]
    painted+=int(dk.sum())
for f in dark_faces:
    pts=[(l[uvl].uv.x*(W-1), l[uvl].uv.y*(H-1)) for l in f.loops]
    if len(pts)<3: continue
    paint_tri(pts[0],pts[1],pts[2])
    if len(pts)==4: paint_tri(pts[0],pts[2],pts[3])
print("texels painted:",painted,"seam tris skipped:",skipped_seam)
out=np.concatenate([T,PX[:,:,3:4]],axis=2)
img.pixels[:]=out.ravel()
img.update(); img.pack()
bpy.ops.export_scene.gltf(filepath='/tmp/man-clean8.glb', export_format='GLB', export_animations=True, export_skins=True, export_yup=True)
s=np.where(T<=0.0031308, T*12.92, 1.055*np.power(np.clip(T,0,1),1/2.4)-0.055)
(np.clip(s,0,1)*255).astype(np.uint8).tofile('/tmp/tex_olive.raw')
print("done")
