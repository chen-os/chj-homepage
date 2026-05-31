import fs from "fs";
import path from "path";

export type DevReportData = {
  exists: boolean;
  reportId: string;
  lastUpdated: string;
  branch: string;
  currentGoal: string;
  modifiedFiles: string[];
  buildStatus: {
    success: boolean;
    label: string;
    detail: string;
  };
  routes: string[];
  knownIssues: string[];
  nextSteps: string[];
};

const EMPTY_REPORT: DevReportData = {
  exists: false,
  reportId: "",
  lastUpdated: "",
  branch: "",
  currentGoal: "",
  modifiedFiles: [],
  buildStatus: { success: false, label: "不明", detail: "" },
  routes: [],
  knownIssues: [],
  nextSteps: [],
};

export function loadDevReport(): DevReportData {
  const filePath = path.join(process.cwd(), "DEV_REPORT.md");

  if (!fs.existsSync(filePath)) {
    return EMPTY_REPORT;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return parseDevReport(content);
}

function parseDevReport(content: string): DevReportData {
  const latestBlock = extractLatestReportBlock(content);
  if (!latestBlock) {
    return { ...EMPTY_REPORT, exists: true };
  }

  const reportId = extractMeta(latestBlock, "报告编号") ?? "";
  const lastUpdated = extractMeta(latestBlock, "最后更新") ?? "";
  const branch = extractMeta(latestBlock, "分支") ?? "";

  const currentGoal = extractSection(latestBlock, "当前目标").trim();
  const modifiedFiles = parseBulletItems(extractSection(latestBlock, "修改文件"));
  const buildSection = extractSection(latestBlock, "npm run build 结果");
  const buildStatus = parseBuildStatus(buildSection);
  const routes = parseRoutes(buildSection);
  const knownIssues = parseBulletItems(extractSection(latestBlock, "已知问题"));
  const nextSteps = parseNumberedItems(extractSection(latestBlock, "下一步建议"));

  return {
    exists: true,
    reportId,
    lastUpdated,
    branch,
    currentGoal,
    modifiedFiles,
    buildStatus,
    routes,
    knownIssues,
    nextSteps,
  };
}

function extractLatestReportBlock(content: string): string | null {
  const match = content.match(/## 最新报告\s*\n([\s\S]*?)(?=\n## 历史报告归档|\n---\s*\n## 历史|$)/);
  return match?.[1]?.trim() ?? null;
}

function extractMeta(block: string, key: string): string | null {
  const pattern = new RegExp(`\\*\\*${key}：\\*\\*\\s*(.+)`);
  const match = block.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractSection(block: string, heading: string): string {
  const pattern = new RegExp(
    `### ${heading}\\s*\\n([\\s\\S]*?)(?=\\n### |$)`,
  );
  const match = block.match(pattern);
  if (!match) return "";

  let section = match[1].trim();
  const fenced = section.match(/```(?:\w*\n)?([\s\S]*?)```/);
  if (fenced) {
    return fenced[1].trim();
  }

  return section;
}

function parseBulletItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, "").replace(/`/g, "").trim())
    .filter(Boolean);
}

function parseNumberedItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean);
}

function parseRoutes(buildSection: string): string[] {
  const routes: string[] = [];

  for (const line of buildSection.split("\n")) {
    const match = line.match(/[┌├└]\s*[ƒ○]\s+(\S+)/);
    if (match) {
      routes.push(match[1]);
    }
  }

  return routes;
}

function parseBuildStatus(buildSection: string): DevReportData["buildStatus"] {
  const detail = buildSection.trim();
  const lower = detail.toLowerCase();

  const success =
    detail.includes("✓ 成功") ||
    lower.includes("exit code 0") ||
    (detail.includes("✓") && !lower.includes("failed") && !detail.includes("失败"));

  const failed =
    detail.includes("失败") ||
    lower.includes("failed") ||
    lower.includes("error") && lower.includes("build");

  if (success && !failed) {
    return { success: true, label: "成功", detail };
  }

  if (failed) {
    return { success: false, label: "失敗", detail };
  }

  return {
    success: false,
    label: detail ? "不明" : "未記録",
    detail,
  };
}
