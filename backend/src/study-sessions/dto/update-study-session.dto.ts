import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateStudySessionDto } from './create-study-session.dto';

// `id` and `itemId` are excluded: a session's identity and the item it
// belongs to are never reassigned via PATCH, only its schedule/status fields.
export class UpdateStudySessionDto extends PartialType(OmitType(CreateStudySessionDto, ['id', 'itemId'] as const)) {}
