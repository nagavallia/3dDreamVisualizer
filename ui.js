
/* global Renderer, vec3 */

$(function(){ UI.Run(); });

UI = {
    
    Renderer: null,
    
    Run:function()
    {
        this.Renderer = new Renderer($('#webglCanvas')[0]); //UI.updateMaze();        
        
        window.requestAnimationFrame(function(){ UI.Renderer.Draw(); }); 
    },
}
