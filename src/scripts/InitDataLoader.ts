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
    CharasMoto: PresetType[];
    Scripts: PresetType[];
  } {
    const presets = this.safeLoadJson<PresetType[]>(presetPath);
    if (!presets) return { CharasMoto: [], Scripts: [] };

    return {
      CharasMoto: presets.filter((item) => item.type === "Chara"),
      Scripts: presets.filter((item) => item.type === "Script"),
    };
  }

  private loadCharasData(charas: PresetType[]): Record<string, CharaType> {
    const charasData: Record<string, CharaType> = {};

    charas.forEach((chara) => {
      if (!chara.path) {
        console.warn(`キャラクターのパスが不明: ${chara.id}`);
        return;
      }

      const data = this.safeLoadJson<CharaType>(`preset/${chara.path}`);
      if (data) charasData[chara.id] = data;
    });

    return charasData;
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
    const OmikenPath = "Omiken/index.json";
    const presetPath = "preset/index.json";

    const Omiken = this.safeLoadJson<OmikenType>(OmikenPath);
    if (!Omiken) throw new Error("Omikenデータの読み込みに失敗");

    const { CharasMoto, Scripts } = this.loadPresets(presetPath);
    const Charas = this.loadCharasData(CharasMoto);

    const { OmikenRulesComment, OmikenRulesTimer } = this.filterRulesByType(
      Omiken.rules,
      Omiken.rulesOrder
    );

    return {
      OmikenOmikuji: Omiken.omikuji,
      OmikenPlace: Omiken.place,
      Visits: (this.store as any).get("Visits", {}),
      Games: (this.store as any).get("Games", {}),
      TimeConfig: (this.store as any).get("TimeConfig", {}),
      OmikenRulesComment,
      OmikenRulesTimer,
      Charas,
      Scripts,
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

  initializeTimeConfig(defaultFrameId: string) {
    const timeConfig = {
      pluginTime: Date.now(),
      defaultFrameId,
      lastTime: 0,
      lastUserId: "",
    };
    (this.store as any).set("TimeConfig", timeConfig);
    return timeConfig;
  }
}
