// Original game identities. These silhouettes describe the games themselves;
// they are deliberately independent of all ability and equipment illustrations.
const emblems={
 survival:{accent:'#e7c27c',dark:'#596347',art:`
  <path d="m19 19 10 4 11-9 11 9 10-4-4 14H23z" fill="#d8b26b" stroke="#f6dc9d" stroke-width="1.5"/><path d="m25 22 5 5 10-8 10 8 5-5-2 8H27z" fill="#fff0be" opacity=".72"/>
  <path d="M23 34h34v20L40 69 23 54z" fill="#323e3e" stroke="#cdb979" stroke-width="2"/><path d="M27 38h13v25L27 52z" fill="#7d9a89"/><path d="M40 38h13v14L40 63z" fill="#47685f"/>
  <path d="m40 39 9 10-9 12-9-12z" fill="#e7c27c"/><path d="m40 42 5 7-5 8z" fill="#fff0bd"/><path d="m15 40 3 4-3 4-3-4zm50 0 3 4-3 4-3-4z" fill="#a0b499"/><path d="M33 68h14" stroke="#f4d898" stroke-width="2" stroke-linecap="round"/>`},
 bonk:{accent:'#f0b5bb',dark:'#62515b',art:`
  <path d="M24 31 10 23l4 17 13 8m29-17 14-8-4 17-13 8" fill="#e6dfc8" stroke="#b8bca5" stroke-width="1.4"/><path d="m15 28 9 8m-8 2 9 5m40-15-9 8m8 2-9 5" stroke="#fff5df" stroke-width="2" stroke-linecap="round"/>
  <path d="M18 55c0-9 7-12 9-22 2-8 10-9 15-6 8-3 15 3 16 10 1 8 7 10 5 19-2 9-39 12-44 4z" fill="#cf819f"/><path d="M21 53c1-7 7-13 9-20 2-5 10-5 13-3 7-1 11 3 12 10 2 7 8 13 3 17-8 6-34 5-37-4" fill="#f2afbd"/>
  <path d="M28 35c2-4 5-4 7-4" stroke="#ffe3da" stroke-width="4" stroke-linecap="round"/><ellipse cx="34" cy="47" rx="2" ry="3" fill="#513d4d"/><ellipse cx="47" cy="47" rx="2" ry="3" fill="#513d4d"/><path d="M38 54q3 3 6 0" fill="none" stroke="#80566c" stroke-width="1.7" stroke-linecap="round"/><path d="m40 11 3 5-3 5-3-5zM13 53l3 3-3 3-3-3zm54 1 3 3-3 3-3-3z" fill="#e3d39c"/>`},
 dungeon:{accent:'#87d2c5',dark:'#46686b',art:`
  <path d="m18 31 9-12h26l9 12v30H18z" fill="#667b76" stroke="#bac7ac" stroke-width="1.4"/><path d="M25 58V35c0-19 30-19 30 0v23z" fill="#102c2d"/><path d="M30 53V35c0-12 20-12 20 0v18z" fill="#4b9693"/><path d="M35 48V35c0-7 10-7 10 0v13z" fill="#9bddd0"/>
  <path d="M31 47h18l4 7H27z" fill="#c4c9ac"/><path d="M27 54h26l5 7H22z" fill="#91a89a"/><path d="M22 61h36l5 7H17z" fill="#597d74"/><path d="M20 31h8m24 0h8M19 41h7m28 0h7M19 51h7m28 0h7" stroke="#b8c3a5" stroke-width="2"/>
  <path d="m40 17 3 4-3 4-3-4z" fill="#f0d397"/><path d="M10 37h6v11h-6zm54 0h6v11h-6z" fill="#bd8d51"/><path d="m10 38 3-8 3 8-3 4zm54 0 3-8 3 8-3 4z" fill="#f3d592"/>`},
 castlefight:{accent:'#b7cbd3',dark:'#465e66',art:`
  <path d="M11 25h6v6h5v-6h6v6h5v-6h6v33H11z" fill="#749ab1" stroke="#b5cfdb" stroke-width="1.2"/><path d="M41 25h6v6h5v-6h6v6h5v-6h6v33H41z" fill="#b8786c" stroke="#e3b498" stroke-width="1.2"/>
  <path d="M15 35h20v23H15z" fill="#466e85"/><path d="M45 35h20v23H45z" fill="#85564e"/><path d="M22 58V47a4 4 0 0 1 8 0v11m20 0V47a4 4 0 0 1 8 0v11" fill="#213a3a"/>
  <path d="M23 14v12m34-12v12" stroke="#e5d2a3" stroke-width="2"/><path d="m24 14 11 4-11 4z" fill="#a9d8ec"/><path d="m56 14-11 4 11 4z" fill="#edb299"/>
  <path d="m28 66 25-24 4 5-25 24z" fill="#e7ddbb" stroke="#637768" stroke-width="1.3"/><path d="m24 44 5-4 26 27-5 4z" fill="#d6c286" stroke="#6e7861" stroke-width="1.3"/><path d="m23 61 8 8m18-1 8-8" stroke="#f5d293" stroke-width="3" stroke-linecap="round"/>`},
 bloody:{accent:'#e19b8c',dark:'#6c4642',art:`
  <path d="M22 15v20m36-20v20" stroke="#dbc5a0" stroke-width="2"/><path d="m23 16 12 3-4 10-8-2zM57 16l-12 3 4 10 8-2z" fill="#c05f5c"/>
  <path d="M22 30h36l-4 21-14 10-14-10z" fill="#af8050" stroke="#efcf91" stroke-width="1.5"/><path d="M28 34h24l-3 14-9 7-9-7z" fill="#754a45"/><path d="M23 34H14v10q0 9 14 10m29-20h9v10q0 9-14 10" fill="none" stroke="#d3ad72" stroke-width="4"/>
  <path d="m40 33 7 12-7 7-7-7z" fill="#d47b75"/><path d="m40 36 3 9-3 3z" fill="#f2b5a1"/><path d="M36 59h8v6h10v5H26v-5h10z" fill="#c3a16c"/><path d="M29 68h22" stroke="#f0d69c" stroke-width="2"/><path d="m40 9 3 4-3 4-3-4z" fill="#ebcf96"/>`},
 linewars:{accent:'#9ac9c9',dark:'#3e6764',art:`
  <path d="M10 22h17v16H10z" fill="#6b9bb3" stroke="#b3d8dd" stroke-width="1.4"/><path d="M53 42h17v16H53z" fill="#b27c68" stroke="#e4b59a" stroke-width="1.4"/><path d="m10 22 8-9 9 9z" fill="#b6cbd1"/><path d="m53 42 8-9 9 9z" fill="#ddbea0"/><path d="M15 38V27h7v11m36 20V47h7v11" fill="#193a3d"/>
  <path d="M31 22h22v18H35v18h14" fill="none" stroke="#6e8f78" stroke-width="9" stroke-linejoin="round"/><path d="M31 22h22v18H35v18h14" fill="none" stroke="#d5c58e" stroke-width="3" stroke-linejoin="round"/><path d="M49 18h9l-5 8zM31 54h9l-5 8z" fill="#f1ddb1"/>
  <path d="M17 43v18h11m35-35V15H41" fill="none" stroke="#5b7c71" stroke-width="5" stroke-linecap="round"/><path d="m24 57 6 4-6 4zm21-46-6 4 6 4z" fill="#a8c6bd"/>`},
 treetag:{accent:'#b1cc85',dark:'#446143',art:`
  <path d="M32 41h18l4 24-13 4-17-5z" fill="#836b4b" stroke="#c2aa78" stroke-width="1.3"/><path d="m36 44 2 19-5 3m11-22-1 16 6 5" fill="none" stroke="#b19b6c" stroke-width="2"/><path d="m18 48-5 11 14 2m30-13 8 11-13 2" fill="none" stroke="#8b7954" stroke-width="6" stroke-linecap="round"/>
  <path d="m16 29 6-12 12-2 6-7 12 9 12 3 4 14-9 12-13 1-8 5-10-7-12-3-5-9z" fill="#456c45" stroke="#8eab69" stroke-width="1.4"/><path d="m21 27 6-8 11-1 4-5 8 8 10 2-2 9-13 1-10 8-13-6z" fill="#81a35d"/><path d="m27 30 9-4 5 6-9 5zm17 2 5-7 9 3-5 8z" fill="#b2c980"/>
  <path d="m31 47 7 2-6 5zm11 2 7-2-1 7z" fill="#e1d29b"/><path d="m34 59 7-3 6 3" fill="none" stroke="#4f4e37" stroke-width="2" stroke-linecap="round"/>`},
 kodotag:{accent:'#b9b5cb',dark:'#57596b',art:`
  <path d="m15 35 6-14 12-4h15l13 8 5 16-4 20-17 8-22-6-9-14z" fill="#6e7184" stroke="#c1bdc8" stroke-width="1.4"/><path d="m24 23 12-7 13 3 10 9-6 13-25-1z" fill="#a6a2b2"/><path d="m27 19 1-10 9 10m10 0 7-10 2 16" fill="#d8ceb6" stroke="#9e9486" stroke-width="1.2"/>
  <path d="m23 42 9-4h21l9 9-5 14-13 5-18-6-7-11z" fill="#8b8599"/><path d="M28 48h26l4 9-15 5-16-6z" fill="#b4a8b1"/><path d="m21 39-9-8 2 16 10 8m36-16 9-8-2 16-9 8" fill="#dfd1b2" stroke="#ab9c88" stroke-width="1.3"/>
  <path d="m25 33 9 2-3 5-6-2zm22 2 9-2v5l-6 2z" fill="#dfc88f"/><path d="M34 53h4m10 0h4" stroke="#5c5367" stroke-width="3" stroke-linecap="round"/><path d="M24 24 17 16m42 10 6-8" stroke="#78828c" stroke-width="4" stroke-linecap="round"/>`},
 warlock:{accent:'#c4abde',dark:'#54416a',art:`
  <path d="m40 11 24 14v28L40 67 16 53V25z" fill="none" stroke="#a98bb5" stroke-width="1.3" opacity=".65"/><ellipse cx="40" cy="61" rx="25" ry="8" fill="#49343f" stroke="#d18f6e" stroke-width="2"/>
  <path d="m21 60 7-28 12-18 14 18 7 28-20 7z" fill="#77718f" stroke="#c6b2cb" stroke-width="1.3"/><path d="m40 20 9 15 5 22-14 7-12-6 3-23z" fill="#38384f"/><path d="m40 22-7 13-3 21 10-5 10 5-4-21z" fill="#202b38"/>
  <path d="m33 37 5 2m4 0 5-2" stroke="#ecdfbd" stroke-width="2.7" stroke-linecap="round"/><path d="m40 49 4 8-4 6-4-6z" fill="#ba91ce"/><path d="m13 31 4 6-4 6-4-6zm54 0 4 6-4 6-4-6zM40 8l3 4-3 4-3-4z" fill="#e1c79d"/><path d="m25 63 4-3m22 0 4 3" stroke="#f0bb88" stroke-width="2" stroke-linecap="round"/>`},
 phasekiller:{accent:'#b8bfcc',dark:'#4e5065',art:`
  <path d="m22 20 18-6 18 6 4 21-8 17-14 11-14-11-8-17z" fill="#bcbcae" stroke="#ece1bc" stroke-width="1.5"/><path d="m40 17 15 5 4 19-7 15-12 10z" fill="#4f4d68"/><path d="m25 23 12-4v42l-9-8-7-14z" fill="#e2d9bb"/>
  <path d="m25 35 10-2-3 9-8-3zm20-2 10 2 1 4-8 3z" fill="#23353b"/><path d="m47 37 5-1-3 4z" fill="#db9a8d"/><path d="m32 54 8-4 8 4" fill="none" stroke="#838278" stroke-width="2" stroke-linecap="round"/>
  <path d="m15 58 43-41 5 1-2 5-42 41z" fill="#8e777b" stroke="#d4b39e" stroke-width="1.2"/><path d="m19 59 38-37" stroke="#f1d5b7" stroke-width="1.5"/><circle cx="12" cy="27" r="3" fill="#9bbfbd"/><circle cx="68" cy="42" r="3" fill="#c5b0d7"/><circle cx="58" cy="68" r="3" fill="#d6b98b"/>`}
};

export const GAME_ICON_KEYS=Object.freeze(Object.keys(emblems));
export function gameIcon(key){
 const name=Object.hasOwn(emblems,key)?key:'survival',emblem=emblems[name];
 return `<svg class="game-emblem game-emblem--${name}" data-game-icon="${name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" aria-hidden="true" focusable="false"><rect x="1.5" y="1.5" width="77" height="77" rx="17" fill="#112c26" stroke="${emblem.accent}" stroke-opacity=".43"/><path d="M18 5h44l13 13v44L62 75H18L5 62V18z" fill="${emblem.dark}" fill-opacity=".25"/><path d="M18 5h44l13 13M5 18v42" fill="none" stroke="${emblem.accent}" stroke-opacity=".23"/><path d="M20 75h42l13-13" fill="none" stroke="#041a16" stroke-width="2"/>${emblem.art}<path d="M11 12h5M12 11v5m52 53h5m-1-1v4" stroke="${emblem.accent}" stroke-opacity=".46" stroke-width="1" stroke-linecap="round"/></svg>`;
}
