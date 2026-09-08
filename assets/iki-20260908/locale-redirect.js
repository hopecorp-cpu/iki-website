/* Existing bookmarks now point to published translations instead of the old placeholder. */
(() => {
 const lang=location.pathname.split('/')[1];
 const pages={academy:'hoc-vien.html',community:'cong-dong.html',app:'app.html',about:'ve-hope.html'};
 const query=new URLSearchParams(location.search), target=pages[query.get('p')];
 if ((lang==='en'||lang==='ja')&&target){query.delete('p');location.replace('/'+lang+'/'+target+(query.size?'?'+query:'')+location.hash);}
})();
