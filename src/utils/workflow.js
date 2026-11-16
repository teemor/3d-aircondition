// 过程节拍总览：工序定义及状态颜色规则，与原页面保持一致。
export const steps = [
  { key: "fj", name: "分解" },
  { key: "tfj", name: "通风" },
  { key: "lnj", name: "冷凝" },
  { key: "qx", name: "清洗" },
  { key: "yrq", name: "预热" },
  { key: "zz", name: "组装" },
  { key: "jx", name: "检修" },
  { key: "sy", name: "试验" },
];

export function stepClass(item, key) {
  return item[key + "Cs"] === "2"
    ? "abnormal"
    : item[key + "Cs"] === "1"
      ? "overtime"
      : { 0: "waiting", 1: "working", 2: "complete" }[item[key + "Status"]] ||
        "";
}
