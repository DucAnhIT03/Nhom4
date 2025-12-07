import { PartialType } from "@nestjs/mapped-types";
import { CreateArtistSongDto } from "./create-artist-song.dto";

export class UpdateArtistSongDto extends PartialType(CreateArtistSongDto) {}

