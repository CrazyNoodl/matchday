import common from './common';
import table from './table';
import home from './home';
import matchday from './matchday';
import setup from './setup';
import stats from './stats';
import tournament from './tournament';
import archive from './archive';
import settings from './settings';
import language from './language';
import seasonStats from './seasonStats';
import matchDetail from './matchDetail';
import players from './players';
import teams from './teams';
import display from './display';
import demo from './demo';
import errorBoundary from './errorBoundary';
import offline from './offline';
import auth from './auth';
import share from './share';
import shareRound from './shareRound';
import developer from './developer';
import backup from './backup';
import importRound from './importRound';
import ocrLab from './ocrLab';
import resizeLab from './resizeLab';
import welcome from './welcome';
import rivalry from './rivalry';
import matchdayStats from './matchdayStats';
import sharedRound from './sharedRound';

const en = {
  common,
  table,
  home,
  matchday,
  setup,
  stats,
  tournament,
  archive,
  settings,
  language,
  seasonStats,
  matchDetail,
  players,
  teams,
  display,
  demo,
  errorBoundary,
  offline,
  auth,
  share,
  shareRound,
  developer,
  backup,
  importRound,
  ocrLab,
  resizeLab,
  welcome,
  rivalry,
  matchdayStats,
  sharedRound,
} as const;

export default en;

export type TranslationKeys = typeof en;

type DeepStringSchema<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringSchema<T[K]>;
};

export type TranslationSchema = DeepStringSchema<typeof en>;
