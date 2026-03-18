import { IsOptional, IsString, IsArray } from "class-validator";

export class ClickToChatTokenDto {
  @IsString()
  campaignId: string;

  @IsString()
  senderFrom: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsString()
  appId?: string;
}
