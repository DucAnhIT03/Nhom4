import { PartialType } from "@nestjs/mapped-types";
import { CreateArtistAlbumDto } from "./create-artist-album.dto";

export class UpdateArtistAlbumDto extends PartialType(CreateArtistAlbumDto) {}

