// src/scripts/InitDataLoader.js
import ElectronStore from "electron-store";
import fs from "fs";
import path from "path";
import {
  PresetType,
  OmikenType,
  RulesType,
  CharaType,
  StoreType,
  GameType,
} from "../types/index";

export class InitDataLoader {
  private store: ElectronStore<StoreType>;
  private basePath: string;

  constructor(store: ElectronStore<StoreType>, basePath: string) {
    this.store = store;
    this.basePath = basePath;
  }

  private safeLoadJson<T>(filePath: string): T | null {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const fileContent = fs.readFileSync(fullPath, "utf-8");
      return JSON.parse(fileContent) as T;
    } catch (error) {
      console.error(`JSONファイルの読み込みに失敗: ${filePath}`, error);
      return null;
    }
  }

  private loadPresets(presetPath: string): {
    PresetsMoto: PresetType[];
    CharasMoto: PresetType[];
    Scripts: PresetType[];
  } {
    const presets = this.safeLoadJson<PresetType[]>(presetPath) || [];

    return presets.reduce(
      (acc, item) => {
        if (item.type === "Omiken") {
          acc.PresetsMoto.push(item);
        } else if (item.type === "Chara") {
          acc.CharasMoto.push(item);
        } else if (item.type === "Script") {
          acc.Scripts.push(item);
        }
        return acc;
      },
      { PresetsMoto: [], CharasMoto: [], Scripts: [] }
    );
  }

  // presetのpathを読んでデータを返す
  private loadCharasData<T>(items: PresetType[]): Record<string, T> {
    const dataMap: Record<string, T> = {};

    items.forEach((item) => {
      if (!item.path) {
        console.warn(`キャラクターのパスが不明: ${item.id}`);
        return;
      }

      const data = this.safeLoadJson<T>(`preset/${item.path}`);
      if (data) dataMap[item.id] = data;
    });

    return dataMap;
  }

  private filterRulesByType(
    rules: Record<string, RulesType>,
    rulesOrder: string[]
  ) {
    return {
      OmikenRulesComment: rulesOrder
        .map((key) => rules[key])
        .filter((rule) => rule.ruleType === "comment"),
      OmikenRulesTimer: rulesOrder
        .map((key) => rules[key])
        .filter((rule) => rule.ruleType === "timer"),
    };
  }

  loadPluginData() {
    const OmikenPath = "Omiken/index.json"; // おみくじデータ
    const presetPath = "preset/index.json"; // presetデータ

    const Omiken = this.safeLoadJson<OmikenType>(OmikenPath);
    if (!Omiken) throw new Error("Omikenデータの読み込みに失敗");

    const { PresetsMoto, CharasMoto, Scripts } = this.loadPresets(presetPath);
    const Charas: Record<string, CharaType> =
      this.loadCharasData<CharaType>(CharasMoto);
    const Presets: Record<string, OmikenType> =
      this.loadCharasData<OmikenType>(PresetsMoto);

    const { OmikenRulesComment, OmikenRulesTimer } = this.filterRulesByType(
      Omiken.rules,
      Omiken.rulesOrder
    );

    return {
      Omiken,
      OmikenRulesComment,
      OmikenRulesTimer,
      OmikenOmikuji: Omiken.omikujis,
      OmikenPlace: Omiken.places,
      Presets,
      Charas,
      Scripts,
      Visits: (this.store as any).get("Visits", {}),
      Games: (this.store as any).get("Games", {}),
      TimeConfig: (this.store as any).get("TimeConfig", {}),
    };
  }

  initializeGames() {
    const Games = (this.store as any).get("Games", {}) as Record<
      string,
      GameType
    >;
    const GamesNew = Object.fromEntries(
      Object.entries(Games).map(([key, game]) => [key, { ...game, draws: 0 }])
    );

    (this.store as any).set("Games", GamesNew);
    return GamesNew;
  }

  initializeTimeConfig() {
    const timeConfig = {
      pluginTime: Date.now(),
      lastTime: 0,
      lastUserId: "",
    };
    (this.store as any).set("TimeConfig", timeConfig);
    return timeConfig;
  }
}
