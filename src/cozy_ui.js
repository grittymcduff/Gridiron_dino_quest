// ===================== SMALL LAYOUT FIXES =====================
// Title screen on phones and tablets: logo at the top, the hero-and-dino scene left clear in the middle,
// and the buttons as a compact 3-across grid down on the grass. The keyboard help line is hidden (it doesn't apply to touch).
(()=>{const st=document.createElement('style');st.textContent=`
body.touch #title{justify-content:flex-start;padding:6px 8px 8px;box-sizing:border-box}
body.touch #titleArt{flex:1 1 auto;min-height:0}
body.touch #titleFoot{display:none}
body.touch #titleBtns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 5px;width:min(100%,520px)}
body.touch #titleBtns button{font-size:11px;line-height:1.2;padding:7px 5px;min-height:0;white-space:normal;overflow:hidden;text-overflow:ellipsis}
body.touch #titleBtns button[style*="display: none"],body.touch #titleBtns button.hidden{display:none}
`;document.head.appendChild(st)})();
