<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import deviceMap from "../public/models/device-map.json";
import { deviceIds } from "./api/api.js";

const emit = defineEmits(["select", "work"]);
const host = ref(null);
const loading = ref(true);
const loadError = ref("");
let renderer,
  scene,
  camera,
  controls,
  resizeObserver,
  animationFrame,
  raycaster,
  pointer,
  modelRoot;
const deviceMaterials = new Map();
const anchors = new Map();
const equipNodes = new Map();
let sanreqiNode, lengningjiNode, tongfengjiNode;
const panelItems = ref([]);
let pendingStates = [];
const names = {
  468990001: ["升降台", "空调机组分解"],
  468990002: ["升降台", "空调机组分解"],
  468990003: ["升降台", "空调机组分解"],
  468990004: ["升降台", "空调机组分解"],
  941990003: ["清洗机", "空调机组清洗"],
  941990004: ["清洗机", "空调机组清洗"],
  743990013: ["预热器试验台", "预热器检修试验"],
  743290002: ["风机试验台", "通风、冷凝风机检修试验"],
  743990016: ["通电试验台", "空调机组通电试验"],
  743990015: ["通电试验台", "空调机组通电试验"],
  743220003: ["性能试验台", "空调机组性能试验"],
  743220004: ["性能试验台", "空调机组性能试验"],
};
const iconMap = {
  1: "green.png",
  3: "red.png",
  4: "chao d.png",
  5: "zi.png",
  6: "guaqi.png",
  7: "dengdai.png",
};

function fitModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.position.sub(box.getCenter(new THREE.Vector3()));
  const distance = Math.max(size.x, size.y, size.z) * 0.8;
  camera.position.set(0, distance * 0.75, distance * 1.2);
  camera.near = Math.max(0.01, distance / 1000);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.minDistance = distance * 0.35;
  controls.maxDistance = distance * 3;
  controls.update();
}

function indexDevices(root) {
  const ids = new Set([...deviceMap.map((item) => item.node), ...deviceIds]);
  root.traverse((object) => {
    // 空调机组等附属件：extras 里带 pid，默认隐藏，有工单时再显示。
    if (object.userData?.pid) {
      const key = String(object.userData.pid);
      equipNodes.set(key, [...(equipNodes.get(key) || []), object]);
    }
    if (object.name === "sanreqi") sanreqiNode = object;
    if (object.name === "lengningji") lengningjiNode = object;
    if (object.name === "tongfengji") tongfengjiNode = object;
    const id = [object.name, object.userData?.sid]
      .filter(Boolean)
      .map(String)
      .find((name) => ids.has(name));
    if (!id) return;
    if (!anchors.has(id)) anchors.set(id, object);
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.deviceId = id;
      const materials = (Array.isArray(child.material) ? child.material : [child.material]).map(
        (material) => material.clone(),
      );
      child.material = Array.isArray(child.material) ? materials : materials[0];
      deviceMaterials.set(id, [...(deviceMaterials.get(id) || []), ...materials]);
    });
  });
}

function updateVisibility(items) {
  // 空调、散热器、冷凝机、通风机默认都不显示。
  for (const nodes of equipNodes.values()) {
    for (const node of nodes) node.visible = false;
  }
  if (sanreqiNode) sanreqiNode.visible = false;
  if (lengningjiNode) lengningjiNode.visible = false;
  if (tongfengjiNode) tongfengjiNode.visible = false;
  for (const item of items) {
    const key = String(item.sbllid);
    const hasWork = !!(item.mroRwgd && item.mroRwgd !== "undefined");
    for (const node of equipNodes.get(key) || []) node.visible = hasWork;
    if (key === "743990013" && sanreqiNode) sanreqiNode.visible = hasWork;
    if (key === "743290002") {
      const attribute28 = String((hasWork && item.mroRwgd.attribute28) || "");
      if (lengningjiNode) lengningjiNode.visible = hasWork && attribute28.includes("冷凝机");
      if (tongfengjiNode) tongfengjiNode.visible = hasWork && attribute28.includes("通风机");
    }
  }
}

function updateStates(items) {
  pendingStates = items || [];
  updateVisibility(pendingStates);
  panelItems.value = pendingStates
    .filter(
      (item) =>
        deviceIds.includes(String(item.sbllid)) &&
        !(item.state || []).includes(2) &&
        (item.mroRwgd || (item.state || []).length),
    )
    .map((item) => ({ ...item, id: String(item.sbllid) }));
  for (const item of pendingStates) {
    const status = item.state || [];
    const color =
      status.includes(4) || status.includes(7)
        ? "#f0a94e"
        : status.includes(1) || status.includes(3)
          ? "#25c7c3"
          : status.includes(5) || status.includes(6)
            ? "#40c98f"
            : "";
    for (const material of deviceMaterials.get(String(item.sbllid)) || []) {
      material.color?.set(color);
      material.emissive?.set(color);
      if ("emissiveIntensity" in material) material.emissiveIntensity = 0.08;
    }
  }
}

function onPointerDown(event) {
  if (!modelRoot) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster
    .intersectObject(modelRoot, true)
    .find((entry) => entry.object.userData.deviceId);
  if (hit) emit("select", hit.object.userData.deviceId);
}

function resize() {
  if (!host.value || !renderer) return;
  const { width, height } = host.value.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
function render() {
  animationFrame = requestAnimationFrame(render);
  controls.update();
  if (modelRoot && host.value) {
    const bounds = host.value.getBoundingClientRect();
    for (const item of panelItems.value) {
      const element = host.value.querySelector(`[data-device-panel="${item.id}"]`);
      const anchor = anchors.get(item.id);
      if (!element || !anchor) continue;
      const box = new THREE.Box3().setFromObject(anchor);
      const point = box.isEmpty()
        ? anchor.getWorldPosition(new THREE.Vector3())
        : box.getCenter(new THREE.Vector3());
      if (!box.isEmpty())
        point.y = box.max.y + Math.max(1, box.getSize(new THREE.Vector3()).y * 0.3);
      point.project(camera);
      element.style.display = point.z < 1 && point.z > -1 ? "" : "none";
      element.style.left = `${(point.x * 0.5 + 0.5) * bounds.width}px`;
      element.style.top = `${(-point.y * 0.5 + 0.5) * bounds.height}px`;
    }
  }
  renderer.render(scene, camera);
}

onMounted(() => {
  scene = new THREE.Scene();
  scene.background = null;
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  host.value.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  scene.add(new THREE.HemisphereLight("#e6f4ff", "#1a2830", 2));
  const key = new THREE.DirectionalLight("#ffffff", 1.9);
  key.position.set(35, 65, 45);
  scene.add(key, new THREE.AmbientLight("#b8d4e4", 0.7));
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host.value);
  resize();
  new GLTFLoader().load(
    "/models/aircondition_production_line_nolights.glb",
    (gltf) => {
      modelRoot = gltf.scene;
      indexDevices(modelRoot);
      scene.add(modelRoot);
      fitModel(modelRoot);
      updateStates(pendingStates);
      loading.value = false;
    },
    undefined,
    (error) => {
      loadError.value = error.message || "模型加载失败";
      loading.value = false;
    },
  );
  render();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrame);
  resizeObserver?.disconnect();
  renderer?.domElement.removeEventListener("pointerdown", onPointerDown);
  controls?.dispose();
  scene?.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    else object.material?.dispose();
  });
  renderer?.dispose();
});
defineExpose({ updateStates });
</script>

<template>
  <div ref="host" class="scene3d">
    <div v-if="loading" class="scene-message">正在载入产线模型…</div>
    <div v-else-if="loadError" class="scene-message error">模型加载失败：{{ loadError }}</div>
    <div
      v-for="item in panelItems"
      :key="item.id"
      :data-device-panel="item.id"
      class="model-panel"
      :class="{
        alert: (item.state || []).includes(3),
        overtime: (item.state || []).includes(4),
      }"
    >
      <button class="model-panel-info" @click.stop="emit('select', item.id)">
        <strong>{{ names[item.id]?.[0] || "升降台" }}</strong
        ><span>{{ names[item.id]?.[1] || "空调机组组装检修" }}</span>
      </button>
      <button
        v-if="item.mroRwgd?.rwgdCzh"
        class="model-panel-train"
        @click.stop="emit('work', item)"
      >
        {{ item.mroRwgd.rwgdCzh }}
      </button>
      <div class="model-panel-icons">
        <img
          v-for="state in item.state.filter((s) => iconMap[s])"
          :key="state"
          :src="'/legacy/' + iconMap[state]"
          :title="
            {
              1: '作业中',
              3: '报警',
              4: '超时',
              5: '状态',
              6: '挂起',
              7: '等待',
            }[state]
          "
          alt=""
        />
      </div>
      <div v-if="item.mroRwgdHisList?.length" class="model-history">
        <div v-for="(work, index) in item.mroRwgdHisList" :key="index">
          {{ work.rwgdCzh }} {{ work.rwgdJsrName }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene3d {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.scene3d :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  outline: 0;
  cursor: grab;
}
.scene3d :deep(canvas:active) {
  cursor: grabbing;
}
.scene-message {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #0717226b;
  color: #bdd1d5;
  font-size: 13px;
  pointer-events: none;
}
.scene-message.error {
  color: #f2ae58;
}
.model-panel {
  position: absolute;
  transform: translate(-50%, -100%);
  min-width: 125px;
  background: rgba(0, 27, 46, 0.9);
  border: 2px solid #02cf7d;
  color: #fff;
  z-index: 1;
  box-shadow: 0 0 8px #00d9af88;
  text-align: center;
}
.model-panel.alert {
  border-color: #ff3434;
}
.model-panel.overtime {
  border-color: #ffb000;
}
.model-panel-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 5px;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.model-panel-info strong {
  font-size: 14px;
}
.model-panel-info span {
  font-size: 11px;
  color: #b9d5e7;
  margin-top: 3px;
}
.model-panel-train {
  width: 100%;
  border: 0;
  background: #02cf7d;
  color: #001919;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}
.overtime .model-panel-train {
  background: #ffb000;
}
.model-panel-icons {
  display: flex;
  justify-content: center;
  gap: 3px;
}
.model-panel-icons img {
  width: 21px;
  height: 21px;
  object-fit: contain;
}
.model-history {
  display: none;
  padding: 5px;
  font-size: 11px;
}
.model-panel:hover .model-history {
  display: block;
}
</style>
