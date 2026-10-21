import bpy, bmesh
import numpy as np
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='/tmp/man-clean6.glb')
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
kill=[]
for f in bm.faces:
    p=f.calc_center_median()
    r,g,b=fuv(f); lum=(r+g+b)/3
    if 130<p.z<160 and -12<p.y<8 and abs(p.x)<18:
        if lum<0.28 or (lum<0.45 and (r-g)<0.12):
            kill.append(f); continue
    if 140<p.z<158 and -6<p.y<3 and 8<abs(p.x)<16:
        if lum<0.42 and b<0.34:
            kill.append(f); continue
print("p5 kill:",len(kill))
if kill: bmesh.ops.delete(bm, geom=kill, context='FACES')
bm.to_mesh(ob.data); bm.free()
bpy.ops.export_scene.gltf(filepath='/tmp/man-clean7.glb', export_format='GLB', export_animations=True, export_skins=True, export_yup=True)
sc=bpy.context.scene
sc.render.engine='BLENDER_WORKBENCH'
sc.display.shading.light='STUDIO'; sc.display.shading.color_type='TEXTURE'
sc.render.resolution_x=640; sc.render.resolution_y=640
cd=bpy.data.cameras.new('c'); cam=bpy.data.objects.new('c',cd)
sc.collection.objects.link(cam); sc.camera=cam
def look(o,pt): o.rotation_euler=(pt-o.location).to_track_quat('-Z','Y').to_euler()
for name,pos,tgt,lens in [('face',Vector((0,-0.75,1.58)),Vector((0,0,1.58)),95),('three4',Vector((-0.6,-0.7,1.60)),Vector((0,0,1.54)),85),('three4r',Vector((0.6,-0.7,1.60)),Vector((0,0,1.54)),85),('below',Vector((0,-0.6,1.30)),Vector((0,0,1.50)),75)]:
    cam.location=pos; look(cam,tgt); cd.lens=lens
    sc.render.filepath=f'/tmp/f8_{name}.png'
    bpy.ops.render.render(write_still=True)
print("done")
