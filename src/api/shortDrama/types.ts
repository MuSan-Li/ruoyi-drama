export type SnowflakeId = string;

/** Omission preserves approved identity/wardrobe continuity. Explicit edits save an unselected candidate. */
export interface ShortDramaImageRevision {
  referencePurpose?: 'identity' | 'identity_revision';
  revisionRequirements?: string;
}

export interface ShortDramaProject {
  id?: SnowflakeId;
  userId?: SnowflakeId;
  projectName: string;
  description?: string;
  originalIdea?: string;
  status?: string;
  artStyle?: string;
  aestheticSkillName?: string;
  directorSkillName?: string;
  composeAspectRatio?: ShortDramaAspectRatio;
  createTime?: string;
  updateTime?: string;
}

export interface ShortDramaScript {
  id?: SnowflakeId;
  projectId: SnowflakeId;
  scriptName: string;
  scriptText?: string;
  outlineText?: string;
  tone?: string;
  sourceType?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ShortDramaStoryboard {
  id?: SnowflakeId;
  projectId: SnowflakeId;
  scriptId: SnowflakeId;
  sceneNo: number;
  sceneTitle?: string;
  sceneText?: string;
  sceneType?: string;
  shotType?: string;
  cameraMove?: string;
  charactersJson?: string;
  locationName?: string;
  photographyRules?: string;
  actingNotes?: string;
  continuityJson?: string;
  sourceText?: string;
  imagePrompt?: string;
  durationSeconds?: number;
  videoPrompt?: string;
  videoUrl?: string;
  videoId?: string;
  videoStatus?: string;
  createTime?: string;
  updateTime?: string;
}

export type ShortDramaTransitionType = 'none' | 'dissolve' | 'fade' | 'slide';
export type ShortDramaAspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9';
export type ShortDramaComposeStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ShortDramaComposeVideoRequest {
  transitionType: ShortDramaTransitionType;
  transitionDurationSeconds: number;
  aspectRatio: ShortDramaAspectRatio;
  storyboardIds: SnowflakeId[];
  /** 旁白语音资产ID（可选） */
  narrationAudioId?: SnowflakeId;
  /** 是否加水印（默认 true，后端默认 ruoyi-ai） */
  watermark?: boolean;
}

export interface ShortDramaComposeVideoResult extends ShortDramaComposeVideoRequest {
  projectId: SnowflakeId;
  status: ShortDramaComposeStatus;
  progress?: number;
  outputDurationSeconds?: number;
  videoOssId?: SnowflakeId;
  videoUrl?: string;
  errorMessage?: string;
  composedAt?: string;
}

export interface ShortDramaCharacter {
  id?: SnowflakeId;
  projectId?: SnowflakeId;
  name: string;
  aliases?: string;
  introduction?: string;
  roleLevel?: string;
  gender?: string;
  ageRange?: string;
  personalityTags?: string;
  costumeTier?: number;
  visualDescription?: string;
  referenceImageUrl?: string;
  appearances?: ShortDramaCharacterAppearance[];
}

export interface ShortDramaCharacterAppearance {
  id?: SnowflakeId;
  characterId?: SnowflakeId;
  appearanceIndex?: number;
  changeReason?: string;
  description?: string;
  referenceImageUrl?: string;
  imageUrls?: string;
  imageDescriptions?: string;
  selectedImageIndex?: number;
  previousImageUrls?: string;
  previousDescriptions?: string;
  voice?: string;
}

export interface ShortDramaLocation {
  id?: SnowflakeId;
  projectId?: SnowflakeId;
  name: string;
  summary?: string;
  hasCrowd?: boolean;
  crowdDescription?: string;
  availableSlots?: string;
  descriptions?: string;
  referenceImageUrl?: string;
  imageUrls?: string;
  imageDescriptions?: string;
  selectedImageIndex?: number;
  previousImageUrls?: string;
  previousDescriptions?: string;
}

export interface ShortDramaDetail {
  project: ShortDramaProject;
  script?: ShortDramaScript;
  characters: ShortDramaCharacter[];
  locations: ShortDramaLocation[];
  audios: ShortDramaAudio[];
  storyboards: ShortDramaStoryboard[];
}

export type ShortDramaAudioType = 'narration' | 'dialogue';

export interface ShortDramaAudio {
  id?: SnowflakeId;
  projectId?: SnowflakeId;
  name: string;
  audioType: ShortDramaAudioType;
  text: string;
  voice?: string;
  audioOssId?: SnowflakeId;
  audioUrl?: string;
  linkedStoryboardId?: SnowflakeId;
  durationSeconds?: number;
  createTime?: string;
  updateTime?: string;
}

export interface ShortDramaIdea {
  aestheticSkillName?: string;
  directorSkillName?: string;
  idea: string;
  model: string;
  projectName?: string;
  artStyle?: string;
}

export type ShortDramaSkillType = 'aesthetic' | 'director';

export interface ShortDramaSkill {
  name: string;
  title: string;
  type: ShortDramaSkillType;
  description: string;
  enabled: boolean;
  artStyle?: string;
  version: string;
}

export interface ShortDramaSkillFile {
  path: string;
  content: string;
}

export interface ShortDramaSkillDetail extends ShortDramaSkill {
  body: string;
  files: ShortDramaSkillFile[];
}
