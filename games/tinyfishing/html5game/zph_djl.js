// (key:string, defValue, ...rest)
function dj_loading_value(key, defValue) {
	var f = window.gml_Script_gmcallback_dj_loading, v = null;
	if (f) {
		var p = Array.prototype.slice.call(arguments, 2);
		p.unshift(key);
		p.unshift(null);
		p.unshift(null);
		v = f.apply(this, p);
	}
	return v != null ? v : defValue;
}
function dj_loading_color(key, defValue) {
	var v = dj_loading_value.apply(this, arguments);
	if (typeof v == "number") {
		v = ((v >> 16) & 0xff) | (v & 0xff00) | ((v & 0xff) << 16); // BGR -> RGB
		v = v.toString(16);
		while (v.length < 6) v = "0" + v;
		v = "#" + v;
	}
	return v;
}
function dj_loading_number(key, defValue) {
	var v = dj_loading_value.apply(this, arguments);
	if (typeof v != "number") v = defValue;
	return v;
}
function dj_loading_string(key, defValue) {
	var v = dj_loading_value.apply(this, arguments);
	if (typeof v != "string") v = defValue;
	return v;
}


var dj_loading_current = 0;
var dj_loading_total = 0;
var dj_loading_width = 0;
var dj_loading_height = 0;
function dj_loading_get_current() { return dj_loading_current; }
function dj_loading_get_total() { return dj_loading_total; }
function dj_loading_get_width() { return dj_loading_width; }
function dj_loading_get_height() { return dj_loading_height; }
function dj_loading(ctx, width, height, total, current) {
  dj_loading_width = width;
  dj_loading_height = height;
  dj_loading_total = Math.max(0, total || 0);
  dj_loading_current = Math.max(0, Math.min(dj_loading_total, current || 0));
  var progress = dj_loading_total ? dj_loading_current / dj_loading_total : 0;
  var barWidth = Math.min(260, width * 0.7), x = (width - barWidth) / 2;
  ctx.fillStyle = '#101a2b';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#e4c98e';
  ctx.textAlign = 'center';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('AUTHORCHE GAMES', width / 2, height / 2 - 24);
  ctx.fillStyle = '#303e54';
  ctx.fillRect(x, height / 2, barWidth, 5);
  ctx.fillStyle = '#e4c98e';
  ctx.fillRect(x, height / 2, barWidth * progress, 5);
  dj_loading_value('draw_post');
}
function dg_hide_loading() {}
