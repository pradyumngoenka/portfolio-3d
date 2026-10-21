import bpy, bmesh
import numpy as np
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='/tmp/man-clean3.glb')
ob=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name=='char1'][0]
mat=ob.data.materials[0]
texnode=None
for n in mat.node_tree.nodes:
    if n.type=='TEX_IMAGE' and n.image: texnode=n; break
img=texnode.image
W,H=img.size
PX=np.array(img.pixels[:],dtype=np.float32)
bm=bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
uvl=bm.loops.layers.uv.active
def fuv(f):
    u=sum(l[uvl].uv.x for l in f.loops)/len(f.loops); v=sum(l[uvl].uv.y for l in f.loops)/len(f.loops)
    x=min(max(int(u*W),0),W-1); y=min(max(int(v*H),0),H-1)
    i=(y*W+x)*4; return PX[i],PX[i+1],PX[i+2]
def isl_dark(isl):
    k=min(len(isl),60); r=g=b=0
    for f in isl[:k]:
        rr,gg,bb=fuv(f); r+=rr; g+=gg; b+=bb
    r/=k; g/=k; b/=k
    return r<0.48 and b<0.32 and (r-g)<0.15
seen=set(); islands=[]
for f in bm.faces:
    if f.index in seen: continue
    stack=[f]; isl=[]
    while stack:
        cf=stack.pop()
        if cf.index in seen: continue
        seen.add(cf.index); isl.append(cf)
        for e in cf.edges:
            for lf in e.link_faces:
                if lf.index not in seen: stack.append(lf)
    islands.append(isl)
kill=set()
for isl in islands:
    n=len(isl)
    if n<3 or n>=800: continue
    c=[f.calc_center_median() for f in isl]
    cz=sum(p.z for p in c)/len(c); cy=sum(p.y for p in c)/len(c); cx=sum(p.x for p in c)/len(c)
    if not (126<cz<157.5 and abs(cx)<17 and cy<1.5): continue
    if not isl_dark(isl): continue
    minz=min(p.z for p in c); maxz=max(p.z for p in c); miny=min(p.y for p in c)
    if minz<=124 or maxz>=158: continue
    if miny<=-11: continue
    for f in isl: kill.add(f.index)
print("p2 kill:",len(kill))
killf=[f for f in bm.faces if f.index in kill]
if killf: bmesh.ops.delete(bm, geom=killf, context='FACES')
bm.to_mesh(ob.data); bm.free()
bpy.ops.export_scene.gltf(filepath='/tmp/man-clean4.glb', export_format='GLB', export_animations=True, export_skins=True, export_yup=True)
sc=bpy.context.scene
sc.render.engine='BLENDER_WORKBENCH'
sc.display.shading.light='STUDIO'; sc.display.shading.color_type='TEXTURE'
sc.render.resolution_x=640; sc.render.resolution_y=640
cd=bpy.data.cameras.new('c'); cam=bpy.data.objects.new('c',cd)
sc.collection.objects.link(cam); sc.camera=cam
def look(o,pt): o.rotation_euler=(pt-o.location).to_track_quat('-Z','Y').to_euler()
for name,pos,tgt,lens in [('face',Vector((0,-0.75,1.58)),Vector((0,0,1.58)),95),('three4',Vector((-0.6,-0.7,1.60)),Vector((0,0,1.54)),85),('three4r',Vector((0.6,-0.7,1.60)),Vector((0,0,1.54)),85),('below',Vector((0,-0.6,1.30)),Vector((0,0,1.50)),75)]:
    cam.location=pos; look(cam,tgt); cd.lens=lens
    sc.render.filepath=f'/tmp/f4_{name}.png'
    bpy.ops.render.render(write_still=True)
print("done")
