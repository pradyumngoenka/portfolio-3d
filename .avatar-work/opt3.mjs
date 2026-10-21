import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { dedup, prune, quantize, meshopt, resample, textureCompress } from '@gltf-transform/functions';
import fs from 'fs';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const doc = await io.read('/tmp/man-clean3.glb');
const jpg = fs.readFileSync('/tmp/tex_clean.jpg');
for (const tex of doc.getRoot().listTextures()) {
  tex.setImage(jpg); tex.setMimeType('image/jpeg');
}
await doc.transform(dedup(), prune(), resample(), quantize(), meshopt({encoder:MeshoptEncoder, level:'medium'}));
await io.write('/tmp/avatar-opt3.glb', doc);
console.log('size:', fs.statSync('/tmp/avatar-opt3.glb').size);
