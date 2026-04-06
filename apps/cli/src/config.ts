import path from "path";
import os from "os";

export interface CliConfig {
  smtpPort: number;
  uiPort: number;
  dataDir: string;
  open: boolean;
  noUi: boolean;
}

const DEFAULT_CONFIG: CliConfig = {
  smtpPort: 2525,
  uiPort: 3333,
  dataDir: path.join(os.homedir(), ".mailfail"),
  open: false,
  noUi: false,
};

export function resolveConfig(flags: Partial<CliConfig>): CliConfig {
  return {
    smtpPort:
      flags.smtpPort ??
      (parseInt(process.env.MAILFAIL_SMTP_PORT ?? "", 10) ||
        DEFAULT_CONFIG.smtpPort),
    uiPort:
      flags.uiPort ??
      (parseInt(process.env.MAILFAIL_UI_PORT ?? "", 10) ||
        DEFAULT_CONFIG.uiPort),
    dataDir:
      flags.dataDir ?? process.env.MAILFAIL_DIR ?? DEFAULT_CONFIG.dataDir,
    open: flags.open ?? DEFAULT_CONFIG.open,
    noUi: flags.noUi ?? DEFAULT_CONFIG.noUi,
  };
}
