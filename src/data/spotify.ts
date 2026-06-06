// Single source of truth for the HERE.AFTER release on Spotify.
// Referenced by SpotifyEmbed, the music page CTA, and the footer.
export const SPOTIFY_ALBUM_ID = '0cLwfhERSggSwKM7PwPqu6';

export const spotifyAlbumUrl = (id: string = SPOTIFY_ALBUM_ID): string =>
  `https://open.spotify.com/album/${id}`;

export const spotifyEmbedSrc = (id: string = SPOTIFY_ALBUM_ID): string =>
  `https://open.spotify.com/embed/album/${id}?utm_source=generator&theme=0`;
