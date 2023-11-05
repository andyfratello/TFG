/**
 * GTD
 * --------------------------------------------------------------------------------------------------
 * @copyright     2020 EDISA (c)
 * @version       2022.02.01
 * @class         gtd
 * @augments      app
 * @constructor
 * @param {Object} o Opciones a sobreescribir
 */
 var gtd = (function (o) {

  var app = this;

  app.fn.cargar_opciones({
    'tarea': '',
    'proyecto': '',
    'etiqueta': '',
    'segundos_refresco': '30',
    'ocultar_barra_lateral': '',
    'vista_inicial': '',
    'cambiar_proyecto_al_refrescar': 'N',
    'contador_tareas_seccion': ''
  }, o);

  app.regiones = ['r_gtd', 'r_alta_proyecto', 'r_gestion_campo'];

  app.llamada_directa = false;

  app.vista_actual = null;
  app.etiqueta_actual = null;
  app.proyecto_actual = null;
  app.tarea_actual = null;

  app.agrupacion = '';

  app.ordenacion = {
    campo: '',
    modo: 'asc',
    tipo: 'NUMBER',
    ordenar_por_seccion: 'S'
  };

  app.opciones = {
    columnas_seccion: {}
  };

  app.timeout = null;

  app.filtros = {};

  app._proyectos = [];

  app._proyecto = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.codigo === 'undefined') return;
    if(typeof p_opciones.secciones === 'undefined') return;

    this.codigo = p_opciones.codigo;
    this.tipo = (p_opciones.tipo || 'P');
    this.nombre = (p_opciones.nombre || '');
    this.status = (parseInt(p_opciones.status) || 100);
    this.descripcion = (p_opciones.descripcion || '');
    this.supervisor = (p_opciones.supervisor || 'N');
    this.fecha_entrega = (p_opciones.fecha_entrega || '');
    this.fecha_creacion = (p_opciones.fecha_creacion || '');
    this.usuario_creacion = (p_opciones.usuario_creacion || '');
    this.color = (p_opciones.color || 'blue_grey').toLowerCase();
    this.publico = (p_opciones.publico || 'N');
    this.gestiona_expedientes = (p_opciones.gestiona_expedientes || 'S');
    this.icono = (p_opciones.icono || 'tasks');

    if(this.tipo === 'U') { this.icono = 'check-circle'; this.color = 'grey_100'; };

    this._secciones_defecto = p_opciones.secciones;
    this.secciones = [];

    this.campos_aux = (p_opciones.campos_aux || []);
    
    this.usuarios = (p_opciones.usuarios || []);
    this.perfiles = (p_opciones.perfiles || []);
    this.equipos = (p_opciones.equipos || []);

    this.esta_archivado = function() {
      return (this.status === 900);
    };

    this.es_modificable = function() {
      return (this.supervisor === 'S' && !this.esta_archivado());
    };

    for(var i in this.usuarios) {
      var u = this.usuarios[i];
      if(typeof u.perfil != 'undefined' && u.perfil != '' && this.perfiles.indexOf(u.perfil) < 0) this.perfiles.push(u.perfil);
      if(typeof u.equipo != 'undefined' && u.equipo != '' && this.equipos.indexOf(u.equipo) < 0) this.equipos.push(u.equipo);
    };

    this.fecha_entrega_color = (this.fecha_entrega != '') ? app.fn._get_color_fecha(this.fecha_entrega) : '';

    this._resumen_proyecto = function() {

      var _this = this;

      var v_html = ['<header class="resumen-proyecto-header"></header><section class="resumen-proyecto-bloque">'];

      v_html.push('<div class="field d100"><div class="input-dinamico-grow" aria-hidden="true">' + _this.nombre + '</div><textarea class="input-dinamico proyecto-input-nombre" maxlength="500">' + _this.nombre + '</textarea></div>');

      v_html.push('<div class="field d100"><div class="textarea richeditor" rel="proyecto-descripcion"><textarea id="proyecto-descripcion" name="proyecto-descripcion" class="richeditor-textarea oculto"></textarea>' + app.fn.generar_loader() + '</div></div>');

      if(_this.tipo === 'P') {

        v_html.push('<div class="field d100"><div class="label"><label>' + app.opts.lang.fecha_entrega + '</label></div><div class="input' + ((_this.fecha_entrega === '') ? ' sin-valor' : '') + '">');
        if(_this.fecha_entrega != '') {
          v_html.push('<button class="input-valor ' + _this.fecha_entrega_color + '">' + _this.fecha_entrega + '</button>');
        } else {
          v_html.push('<button class="btn-input-sin-valor icon icon-calendar"></button>');
        };

        v_html.push('<input class="input-calendario proyecto-fecha-entrega" type="text" maxlength="10" value="' + _this.fecha_entrega + '" />');
        if(_this.es_modificable()) v_html.push('<button class="btn-limpiar-campo icon icon-times-circle"></button>');
        v_html.push('</div></div>');

      };

      v_html.push('<div class="field d100"><div class="label"><label>' + app.erp.alta_proyecto.p_gestiona_expedientes.etiqueta + '</label></div><div class="input"><input type="checkbox" ' + ((_this.gestiona_expedientes === 'S') ? ' checked' : '') + ' class="proyecto-gestiona-expedientes tal icon icon-check nodesc" value="S" autocomplete="off"></div></div>');

      v_html.push('<div class="field d100"><h3 class="d100 mt4 mb2">' +  app.opts.lang.campos_auxiliares + '</h3><ul class="sortable-panel sortable-panel-campos">');
      for(var c in _this.campos_aux) {
        
        var v_campo = _this.campos_aux[c];

        v_html.push('<li class="elem-campo-aux" data-campo="' + v_campo.campo + '">');
        if(_this.es_modificable()) v_html.push('<span class="btn-handle"><svg class="drag-icon" focusable="false" viewBox="0 0 24 24"><path d="M10,4c0,1.1-0.9,2-2,2S6,5.1,6,4s0.9-2,2-2S10,2.9,10,4z M16,2c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,2,16,2z M8,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,10,8,10z M16,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,10,16,10z M8,18 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,18,8,18z M16,18c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,18,16,18z"></path></svg></span>');
        v_html.push('<div class="label"><label>' + v_campo.nombre + '</label></div>');
        v_html.push('<div class="input">');
        v_html.push('<input id="chk-campo-aux-' + v_campo.campo + '" class="chk-activar-campo-aux" type="checkbox"' + ((v_campo.activo === 'S') ? ' checked' : '') + ' data-campo="' + v_campo.campo + '">' + '</input>');
        v_html.push('</div>');
        v_html.push('</li>');

      };

      if(_this.es_modificable()) v_html.push('<li class="elem-campo-aux elem-nuevo-campo"><button class="btn-nuevo-campo"><span class="icon icon-plus"></span>' + app.opts.lang.btn_nuevo_campo + '</button></li>');

      v_html.push('</ul></div>');
      
      if(_this.tipo != 'U') {

        v_html.push('<div class="field d100"><h3 class="d100 mt4 mb2">' +  app.opts.lang.permisos + '</h3>');

        if(_this.es_modificable()) v_html.push('<button class="btn-nuevo-permiso"><span class="icon icon-plus"></span>' + app.opts.lang.btn_nuevo_permiso + '</button>');

        v_html.push('<h4 class="d100 mt2 mb2">' +  app.opts.lang.perfiles + '</h4>');
        v_html.push('<ul class="lista-permisos-proyecto flex">');
        for(var i in _this.perfiles) {
          var v = _this.perfiles[i];
          v_html.push('<li class="elem-permiso" data-origen="P" data-perfil="' + v + '"" title="' + v + '">' + app.fn._get_avatar_origen({'tipo': 'P'}) + '<p class="lbl">' + app.permisos.perfiles['_' + v] + '</p></li>');
        };
        v_html.push('</ul>');

        v_html.push('<h4 class="d100 mt2 mb2">' +  app.opts.lang.equipos + '</h4>');
        v_html.push('<ul class="lista-permisos-proyecto flex">');
        for(var i in _this.equipos) {
          var v = _this.equipos[i];
          v_html.push('<li class="elem-permiso" data-origen="E" data-equipo="' + v + '"" title="' + v + '">' + app.fn._get_avatar_origen({'tipo': 'E'}) + '<p class="lbl">' + app.permisos.equipos['_' + v] + '</p></li>');
        };
        v_html.push('</ul>');

        v_html.push('<h4 class="d100 mt2 mb2">' +  app.opts.lang.usuarios + '</h4>');
        v_html.push('<ul class="lista-permisos-proyecto">');
        for(var i in _this.usuarios) {
          var v_usuario = _this.usuarios[i];
          if(v_usuario.usuario != app.opts.usuario.usuario)  {
            if(typeof v_usuario.d_usuario === 'undefined') v_usuario.d_usuario = app.fn._get_nombre_usuario(v_usuario.usuario);
            if(typeof v_usuario.equipo === 'undefined') v_usuario.equipo = '';
            if(typeof v_usuario.perfil === 'undefined') v_usuario.perfil = '';
            var v_clase = ((v_usuario.perfil != '' || v_usuario.equipo != '') ? ' dependiente' : '');
            v_html.push('<li class="elem-permiso' + v_clase + '" data-origen="' + v_usuario.origen + '"  data-usuario="' + v_usuario.usuario + '" data-perfil="' + v_usuario.perfil + '"  data-equipo="' + v_usuario.equipo + '" title="' + ((v_usuario.perfil != '') ? v_usuario.perfil : v_usuario.equipo) + '"><div class="avatar-wrapper">' + app.fn._get_avatar_usuario({'usuario': v_usuario.usuario, 'alt': v_usuario.d_usuario}) );
            if(v_usuario.perfil != '') v_html.push( app.fn._get_avatar_origen({'tipo': 'P', 'clase': 'dep'}) );
            if(v_usuario.equipo != '') v_html.push( app.fn._get_avatar_origen({'tipo': 'E', 'clase': 'dep'}) );
            v_html.push('</div>');
            v_html.push('<p class="lbl">' + v_usuario.d_usuario + '</p>');
            if(v_usuario.supervisor === 'S') v_html.push( '<span class="es-supervisor icon icon-crown"></span>' );
            v_html.push('</li>');
          };
        };
        v_html.push('</ul>');
        v_html.push('</div>');

        // archivar y eliminar
        if(_this.supervisor === 'S') {

          v_html.push('<div class="button-contain d100 mt4">');
          if(_this.status == 100) {
            v_html.push('<button id="btn_archivar_proyecto" class="btnborder btnshadow btnanswer btngris">' + app.opts.lang.archivar + '</button>');
          } else {
            v_html.push('<button id="btn_reactivar_proyecto" class="btnborder btnshadow btnanswer btngris">' + app.opts.lang.reactivar + '</button>');
          };
          v_html.push('<button id="btn_eliminar_proyecto" class="btnborder btnshadow btnanswer btnrojo">' + app.opts.lang.eliminar + '</button>');
          v_html.push('</div>');

        };

      };

      v_html.push('</section>');

      app.tpl.gtd.resumen.empty().append( v_html.join('') );

      _this._aplicar_eventos( app.tpl.gtd.resumen );

    };

    this._aplicar_eventos = function($el) {

      var _this = this;

      if(_this.es_modificable()) {

        // NOMBRE

        $el.off('focus', '.proyecto-input-nombre').on('focus', '.proyecto-input-nombre', function(e) {

          app.fn.desactivar_timeout();

        }).off('focusout', '.proyecto-input-nombre').on('focusout', '.proyecto-input-nombre', function(e) {

          var v_val = $(this).val();
          if(app.proyecto_actual.nombre === v_val) app.fn.activar_timeout();

        }).off('change', '.proyecto-input-nombre').on('change', '.proyecto-input-nombre', function(e) {
        
          var v_val = $(this).val();

          if(v_val != '') {
              
            app.fn.upd_proyecto({
              'proyecto': app.proyecto_actual,
              'campo': 'NOMBRE',
              'valor': v_val
            });

          } else {
            $(this).val( app.proyecto_actual.nombre );
            app.fn.activar_timeout();
          };

        }).off('keydown', 'textarea.proyecto-input-nombre').on('keydown', 'textarea.proyecto-input-nombre', function(e) {

          if(e.keyCode === 13) { e.preventDefault(); return false; }

        }).off('keyup', 'textarea.proyecto-input-nombre').on('keyup', 'textarea.proyecto-input-nombre', function(e) {

          var v_val = $(this).val();
          $(this).parent().find('.input-dinamico-grow').html( v_val );
          app.tpl.gtd.menu_header.find('.proyecto-nombre').html( v_val );

        });

        // FECHA ENTREGA
        if(_this.tipo === 'P') {

          $el.off('blur', '.proyecto-fecha-entrega').on('blur', '.proyecto-fecha-entrega', function(e) {

            var v_val = $(this).val();

            if(v_val != app.proyecto_actual.fecha_entrega) {
                app.fn.upd_proyecto({
                'proyecto': app.proyecto_actual,
                'campo': 'FECHA_ENTREGA',
                'valor': v_val
              });
            } else {
              app.fn.activar_timeout();
            };

          });

        };

        $el.off('change', '.proyecto-gestiona-expedientes').on('change', '.proyecto-gestiona-expedientes', function(e) {

          var v_val =(e.target.checked) ? 'S' : 'N';

          if(v_val != app.proyecto_actual.gestiona_expedientes) {
              app.fn.upd_proyecto({
              'proyecto': app.proyecto_actual,
              'campo': 'GESTIONA_EXPEDIENTES',
              'valor': v_val
            });
          } else {
            app.fn.activar_timeout();
          };

        });

        // CAMPOS AUX
        app.sortable.campos = sortable('.sortable-panel-campos', {
          forcePlaceholderSize: true,
          handle: '.btn-handle',
          //connectWith: '.sortable-panel-campos',
          items: '.elem-campo-aux:not(.elem-nuevo-campo)',
          placeholder: '<li class="elem-campo-aux elem-campo-placeholder"></li>'
        });
    
        $('.sortable-panel-campos').off('sortstart').on('sortstart', function(e) {
          app.fn.desactivar_timeout();
        }).off('sortstop').on('sortstop', function(e) {
          app.fn.activar_timeout();
        }).off('sortupdate').on('sortupdate', function(e) {
    
          var v_campo = app.fn.buscar_por_id(_this.campos_aux, 'campo', c);
          var v_id = v_campo.campo.split('_');
          v_campo.codigo = v_id[0];
          v_campo.tipo_despliegue = v_id[1];

          app.fn.upd_campo_aux({'codigo': v_campo.codigo, 'tipo_despliegue': v_campo.tipo_despliegue, 'activo': '', 'orden': e.detail.destination.index});
    
        });

        $el.off('click', '.elem-campo-aux:not(.elem-nuevo-campo)').on('click', '.elem-campo-aux:not(.elem-nuevo-campo)', function(e) {
          
          var v_target = (['INPUT'].indexOf(e.target.nodeName) >= 0 || e.target.className.indexOf('chk-activar-campo-aux') >= 0);

          var c = $(this).data('campo');
          var v_campo = app.fn.buscar_por_id(_this.campos_aux, 'campo', c);
          var v_id = v_campo.campo.split('_');
          v_campo.codigo = v_id[0];
          v_campo.tipo_despliegue = v_id[1];

          if(!v_target) {
            app.fn.mostrar_gestion_campo_aux(v_campo);
          } else {
            v_campo.activo = (e.target.checked) ? 'S' : 'N';
            app.fn.upd_campo_aux({'codigo': v_campo.codigo, 'tipo_despliegue': v_campo.tipo_despliegue, 'activo': v_campo.activo, 'orden': ''});
          };

        });

        $el.off('click', '.btn-nuevo-campo').on('click', '.btn-nuevo-campo', function(){
          var v_campo = {'codigo': '', 'tipo_despliegue': 'P', 'tipo': 'A', 'descripcion': ''};
          app.fn.mostrar_gestion_campo_aux(v_campo);
        });

        $el.off('click', '.btn-nuevo-permiso').on('click', '.btn-nuevo-permiso', function(){
          app.fn.asignar_permiso();
        });

        app.fn._aplicar_eventos_generales($el);

      } else {

        $el.find('textarea, input').attr('disabled', 'disabled');
        $el.find('.btn-limpiar-campo, .btn-input-sin-valor, .btn-input-ins-valor, .btn-del-tarea-etiqueta, .editar-tarea-input-nombre').remove();

      };

      if(_this.supervisor === 'S') {

        $el.off('click', '#btn_archivar_proyecto').on('click', '#btn_archivar_proyecto', function(){
         
          msg.ask(app.opts.lang.msg_archivar_proyecto, function(val) {
            if(val === 'Y') {
              app.fn.upd_proyecto({
                'proyecto': app.proyecto_actual,
                'campo': 'STATUS',
                'valor': 900
              });
            };
          }, {'title': app.opts.lang.archivar, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});

        });

        $el.off('click', '#btn_reactivar_proyecto').on('click', '#btn_reactivar_proyecto', function(){
        
            app.fn.upd_proyecto({
              'proyecto': app.proyecto_actual,
              'campo': 'STATUS',
              'valor': 100
            });

        });

        $el.off('click', '#btn_eliminar_proyecto').on('click', '#btn_eliminar_proyecto', function(){
         
          msg.ask(app.opts.lang.msg_del_proyecto, function(val) {
            if(val === 'Y') app.fn.del_proyecto();
          }, {'title': app.opts.lang.borrar, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});

        });

      };

      $el.find('.lista-permisos-proyecto').find('.elem-permiso.dependiente').tooltip();

    };

    this._actualizar_campo = function(p_parametros) {

      var _this = this;

      switch (p_parametros.campo) {
        case 'NOMBRE':
          _this.nombre = p_parametros.valor;
          var v_selector = (_this.tipo != 'U') ? '#sbpr-' + _this.codigo + ' .lbl' : '#lbl-menu-mis-tareas';
          app.tpl.gtd.sidebar.find(v_selector).html(_this.nombre);
          break;
        case 'FECHA_ENTREGA':
          _this.fecha_entrega = p_parametros.valor;
          _this.fecha_entrega_color = (_this.fecha_entrega != '') ? app.fn._get_color_fecha(_this.fecha_entrega) : '';
          break;
        case 'ICONO':
          _this.icono = p_parametros.valor;
          break;
        case 'COLOR':
          _this.color = p_parametros.valor.toLowerCase();
          break;
        case 'DESCRIPCION':
          _this.descripcion = p_parametros.valor_clob;
          break;
        case 'GESTIONA_EXPEDIENTES':
          _this.gestiona_expedientes = p_parametros.valor;
          break;
        default:
          break;
      };

      if(p_parametros.campo === 'ICONO' || p_parametros.campo === 'COLOR') _this._refrescar_color_icono();

      _this._resumen_proyecto();
      app.fn.procesar_resumen_proyecto();

    };

    this._recargar_secciones = function() {

      var _this = this;

      if((app.agrupacion != '' || app.ordenacion.ordenar_por_seccion !== 'S') && app.proyecto_actual != null && app.proyecto_actual.codigo === _this.codigo) {

        var v_secciones = [];
        var v_tipo_ordenacion = 'VARCHAR2';
        v_secciones.push({'codigo': 'NULL', 'nombre': '&nbsp;', 'orden': -1});

        if(app.agrupacion === 'usuario_responsable') {

          for(var s in _this.usuarios) {
            var u = _this.usuarios[s]['usuario'];
            v_secciones.push({
              'codigo': u.toString(),
              'nombre': app.fn._get_nombre_usuario(u),
              'orden': 0
            });
          };

        } else if(app.agrupacion === 'fecha_entrega') {

          for(var s in app._tareas) {
            var t = app._tareas[s];
            if(typeof t.secciones[_this.codigo] != 'undefined' && t.tarea_padre === '' && (app.parametros.filtro_status_tarea === 'T' || t.status === app.parametros.filtro_status_tarea)) {
              var e = t['fecha_entrega'];
              if(e != '' && (v_secciones.length === 0 || app.fn.buscar_index_por_id(v_secciones, 'codigo', e) < 0)) {
                v_secciones.push({'codigo': e, 'nombre': e, 'orden': 0});
              };
            };
          };

          v_tipo_ordenacion = 'DATE';

        } else if(app.agrupacion === 'crm_expediente_linea') {

          for(var s in app._tareas) {
            var t = app._tareas[s];
            if(typeof t.secciones[_this.codigo] != 'undefined' && t.tarea_padre === '' && (app.parametros.filtro_status_tarea === 'T' || t.status === app.parametros.filtro_status_tarea)) {
              var e = t['crm_numero_expediente'].toString();
              if(e != '' && (v_secciones.length === 0 || app.fn.buscar_index_por_id(v_secciones, 'codigo', e) < 0)) {
                v_secciones.push({'codigo': e, 'nombre': e, 'orden': 0});
              };
            };
          };

          v_tipo_ordenacion = 'NUMBER';

        } else {

          var c = app.fn.buscar_por_id(_this.campos_aux, 'campo', app.agrupacion);
          if(c != null) {

            if(c.tipo === 'S') {

              for(var s in c.valores) {
                v_secciones.push({
                  'codigo': c.valores[s]['codigo'].toString(),
                  'nombre': c.valores[s]['valor'],
                  'orden': c.valores[s]['orden'],
                  'color': c.valores[s]['color']
                });
              };

            } else {

              for(var s in app._tareas) {
                var t = app._tareas[s];
                if(t.tarea_padre === '' && typeof t['campos_aux'] != 'undefined' && typeof t['campos_aux'][_this.codigo] != 'undefined') {
                  if(typeof t.secciones[_this.codigo] != 'undefined' && (app.parametros.filtro_status_tarea === 'T' || t.status === app.parametros.filtro_status_tarea)) {
                    var v_campo = t['campos_aux'][_this.codigo][c.campo];
                    if(typeof v_campo != 'undefined') {
                      var e = v_campo.toString();
                      if(e != '' && (v_secciones.length === 0 || app.fn.buscar_index_por_id(v_secciones, 'codigo', e) < 0)) {
                        var v = app.fn.buscar_por_id(c.valores, 'codigo', e);
                        v_secciones.push({'codigo': e, 'nombre': ((v != null) ? v.descripcion : e), 'orden': 0});
                      };
                    };
                  };
                };
              };

            };

          };

        };

        v_secciones = app.fn.ordenar_array_sql(v_secciones, {"nombre":["asc", v_tipo_ordenacion]});

      } else {
        v_secciones = _this._secciones_defecto;
      };

      _this.secciones = [];

      for(var i in v_secciones) {
        var v_opts = v_secciones[i];
        v_opts.modificable = _this.es_modificable();
        v_opts.proyecto = _this.codigo;
        _this.secciones.push( new app._seccion(v_opts) );
      };

    };

    this._controlar_limites_secciones = function() {

      var _this = this;

      for(var i in _this.secciones) {
        var s = _this.secciones[i];
        s._controlar_limites();
      };

    };

    this._cambiar_icono = function() {

      var _this = this;

      app.fn.erp_lanzar_lv({'selector_icono': true,'callback': function(p_valor){
        if(p_valor != 'X' && p_valor != _this.icono) {
          app.fn.upd_proyecto({
            'proyecto': app.proyecto_actual,
            'campo': 'ICONO',
            'valor': p_valor
          });
        };
      }});

    };

    this._cambiar_color = function() {

      var _this = this;

      app.fn.erp_lanzar_lv({'selector_color': true,'callback': function(p_valor){
        if(p_valor != 'X' && p_valor != _this.color) {
          app.fn.upd_proyecto({
            'proyecto': app.proyecto_actual,
            'campo': 'COLOR',
            'valor': p_valor
          });
        };
      }});

    };

    this._refrescar_color_icono = function() {
      
      var _this = this;

      app.tpl.gtd.menu_logo.find('.btn-logo').removeClass().addClass('btn-logo color_libra_' + _this.color + '_bg');
      app.tpl.gtd.menu_logo.find('.icon').removeClass().addClass('icon icon-' + _this.icono);

      var v_selector = (_this.tipo != 'U') ? '#sbpr-' + _this.codigo : '.sidebar-menu-mis-tareas';
      
      app.tpl.gtd.sidebar.find(v_selector + ' .icon').removeClass().addClass('icon icon-' + _this.icono + ' color_libra_' + _this.color + '_bg');
      
    };

    this._refrescar_contador_tareas = function() {
      
      // TODO: tendrá que venir el número de tareas finalizadas en la info del proyecto
      /*var _this = this;

      if(app.proyecto_actual != null && app.proyecto_actual.tipo === 'U') return;

      var v_contador = {
        total: 0,
        finalizadas: 0
      };

      if(typeof _this.tareas != 'undefined') {
        v_contador.total = _this.tareas.length;
        for(var i in _this.tareas) {
          var t = app._tareas[_this.tareas[i]['i']];
          if(t.status === 'F') v_contador.finalizadas += 1;
        };
      };

      var v_html = [];

      if(typeof app.ob.progress_bar != 'undefined') {
        var v_porc = Math.round( (v_contador.finalizadas * 100) / v_contador.total );
        var pb = new app.ob.progress_bar();
        pb.init({'porcentaje': v_porc, 'color': '#669900', 'textos_barra':{'izquierda': v_contador.finalizadas,'derecha': v_contador.total}});
        pb.generar();
        v_html.push( pb.dom.progress_bar[0].outerHTML );
      };

      app.tpl.gtd.menu_header.find('.proyecto-contador-tareas').html( v_html.join('') );*/

    };

    this._recargar_secciones();

    return this;

  };

  app._seccion = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.codigo === 'undefined') return;

    this.codigo = p_opciones.codigo.toString();
    this.nombre = (p_opciones.nombre || '');
    this.color = (p_opciones.color || '').toLowerCase();
    this.orden = p_opciones.orden;
    this.minimo_tareas = (p_opciones.minimo_tareas || 0);
    this.maximo_tareas = (p_opciones.maximo_tareas || 0);
    this.observaciones = (p_opciones.observaciones || '');
    this.proyecto = (p_opciones.proyecto || '');
    this.columnas = (p_opciones.columnas || 1);

    this.modificable = (typeof p_opciones.modificable != 'undefined') ? p_opciones.modificable : true;
    if(app.agrupacion != '' || app.ordenacion.ordenar_por_seccion !== 'S') this.modificable = false;

    this.colapsado = false;

    this.$dom = $('<li class="seccion-proyecto"></li>');

    this._actualizar_dom = function() {

      var _this = this;

      if(app.vista_actual === 'tablero') _this.colapsado = false;

      var v_html = [];

      if(app.ordenacion.ordenar_por_seccion === 'S' || app.vista_actual === 'tablero') {

        v_html.push('<div class="seccion-proyecto-header">');

        if(_this.modificable) {
          v_html.push('<span class="btn-handle"><svg class="drag-icon" focusable="false" viewBox="0 0 24 24"><path d="M10,4c0,1.1-0.9,2-2,2S6,5.1,6,4s0.9-2,2-2S10,2.9,10,4z M16,2c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,2,16,2z M8,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,10,8,10z M16,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,10,16,10z M8,18 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,18,8,18z M16,18c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,18,16,18z"></path></svg></span>');
        } else {
          v_html.push('<span class="sep"></span>');
        };

        if(app.proyecto_actual != null) v_html.push('<div class="btn-toggle btn-toggle-seccion icon icon-angle-' + ((!_this.colapsado) ? 'down' : 'right') + '" role="button" aria-label="" tabindex="0"></div>');

        v_html.push('<div class="seccion-header-l flex">');

        if(app.parametros.contador_tareas_seccion === 'S') v_html.push('<div class="seccion-contador-tareas">0</div>');
        
        if(_this.modificable) {
          v_html.push('<input class="input-dinamico seccion-input-nombre' + ((_this.color != '') ? ' color_libra_' + _this.color : '') + '" type="text" maxlength="100" value="' + _this.nombre + '" />');
        } else {
          v_html.push('<div class="seccion-input-nombre' + ((_this.color != '') ? ' color_libra_' + _this.color : '') + '">' + ((app.agrupacion === 'usuario_responsable') ? app.fn._get_avatar_usuario({'usuario': _this.codigo, 'clase': 'avatar-s mr1'}) : '') + '<span>' + _this.nombre + '</span></div>');
        };

        v_html.push('</div>');

        v_html.push('<div class="seccion-acciones"><div class="seccion-acciones-wrapper">');
        if(_this.modificable || app.vista_actual === 'tablero') v_html.push('<button class="btn-accion-seccion btn-menu-seccion"><span class="icon icon-ellipsis-h"></span></button>');
        v_html.push('</div></div>');

        v_html.push('<div class="seccion-limites oculto"><button class="seccion-limite seccion-limite-minimo"><span class="icon icon-arrow-alt-from-top"></span><span class="num">' + _this.minimo_tareas + '</span></button><button class="seccion-limite seccion-limite-maximo"><span class="icon icon-arrow-alt-from-bottom"></span><span class="num">' + _this.maximo_tareas + '</span></button></div>');

        v_html.push('</div>');

      };

      if(_this.observaciones != '' && app.vista_actual != 'tablero') v_html.push('<div class="seccion-proyecto-observaciones' + ((!_this.colapsado) ? '' : ' oculto') + '">' + _this.observaciones + '</div>');
      
      v_html.push('<ul class="sortable-panel sortable-panel-tareas' + ((!_this.colapsado) ? '' : ' colapsado') + '" data-seccion="' + _this.codigo + '"></ul>');

      if(_this.observaciones != '' && app.vista_actual === 'tablero') v_html.push('<div class="seccion-proyecto-observaciones">' + _this.observaciones + '</div>');
      
      _this.$dom.empty().append( v_html.join('') ).data('seccion', _this.codigo);

      if(_this.columnas_tablero > 1) _this.$dom.addClass('x' + _this.columnas_tablero + 'col');

      _this.$dom.off('click', '.btn-toggle-seccion').on('click', '.btn-toggle-seccion',function(){
        var s = $(this).closest('.seccion-proyecto').data('seccion');
        if(!app.fn.es_nulo(s)) {
          s = app.fn._get_seccion(s);
          s._colapsar();
        };
      });

      _this._aplicar_eventos();

      return _this.$dom;

    };

    this._aplicar_eventos = function() {

      var _this = this;

      if(_this.modificable) {

        _this.$dom.off('focus', '.seccion-input-nombre').on('focus', '.seccion-input-nombre', function(e) {
          app.fn.desactivar_timeout();
        }).off('focusout', '.seccion-input-nombre').on('focusout', '.seccion-input-nombre', function(e) {
          var s = $(this).closest('.seccion-proyecto').data('seccion');
          if(!app.fn.es_nulo(s)) {
            s = app.fn._get_seccion(s);
            var v_val = $(this).val();
            if(s.nombre === v_val) app.fn.activar_timeout();
          };
        }).off('change', '.seccion-input-nombre').on('change', '.seccion-input-nombre', function(e) {
          
          var s = $(this).closest('.seccion-proyecto').data('seccion');
          if(!app.fn.es_nulo(s)) {
            s = app.fn._get_seccion(s);

            var v_val = $(this).val();

            if(v_val != '') {
                
              app.fn.upd_seccion({
                'seccion': s,
                'campo': 'NOMBRE',
                'valor': v_val
              });

            } else {
              $(this).val( s.nombre );
              app.fn.activar_timeout();
            };

          };

        });

      };

      if(app.vista_actual === 'tablero') {

        _this.$dom.on('mouseover', '.seccion-proyecto-header', function(){
          $(this).parent().addClass('seleccionada');
        }).on('mouseout', '.seccion-proyecto-header', function(){
          $(this).parent().removeClass('seleccionada');
        });

      };

    };

    this._colapsar = function() {

      var _this = this;

      _this.colapsado = !(_this.colapsado);
      _this.$dom.find('.btn-toggle-seccion').toggleClass('icon-angle-down', !_this.colapsado).toggleClass('icon-angle-right', _this.colapsado);
      _this.$dom.find('.sortable-panel-tareas').toggleClass('colapsado', _this.colapsado);
      _this.$dom.find('.seccion-proyecto-observaciones').toggle(!_this.colapsado);

    };

    this._get_opcion_columnas_seccion = function() {

      var _this = this;

      var v_num = 1;

      /*if(typeof app.opciones.columnas_seccion[_this.proyecto] !== 'undefined') {
        v_num = (app.opciones.columnas_seccion[_this.proyecto][app.agrupacion +  '_' + _this.codigo] || 1);
        if(app.fn.es_nulo(v_num)) v_num = 1;
      };*/
      v_num = _this.columnas;

      return v_num;

    };

    this._set_opcion_columnas_seccion = function() {

      var _this = this;

      //if(typeof app.opciones.columnas_seccion[_this.proyecto] === 'undefined') app.opciones.columnas_seccion[_this.proyecto] = {};
      //app.opciones.columnas_seccion[_this.proyecto][app.agrupacion +  '_' + _this.codigo] = _this.columnas_tablero;
      _this.columnas = _this.columnas_tablero;

      if(_this.modificable) app.fn.enviar_beacon(app.opts.api + app.opts.modulo + '/set_opcion_usuario_seccion', {'proyecto': _this.proyecto, 'seccion': _this.codigo, 'opcion': 'COLUMNAS', 'valor': _this.columnas});

    };

    this._asignar_columnas = function(p_numero) {

      var _this = this;

      _this.$dom.removeClass('x' + _this.columnas_tablero + 'col');

      _this.columnas_tablero = parseInt(p_numero);
      if(_this.columnas_tablero > 4) _this.columnas_tablero = 1;
      if(_this.columnas_tablero > 1) _this.$dom.addClass('x' + _this.columnas_tablero + 'col');

      _this._set_opcion_columnas_seccion();

    };

    this._actualizar_campo = function(p_parametros) {

      var _this = this;

      switch (p_parametros.campo) {
        case 'NOMBRE':
          _this.nombre = p_parametros.valor;
          _this.$dom.find('.seccion-input-nombre').val( _this.nombre );
          break;
        case 'ORDEN':
          _this.orden = parseInt(p_parametros.valor);
          break;
        case 'COLOR':
          _this.color = p_parametros.valor.toLowerCase();
          _this.$dom.find('.seccion-input-nombre').removeClass(function (index, css) {
            return (css.match (/\bcolor_libra_\S+/g) || []).join(' ');
          });
          if(_this.color != '') _this.$dom.find('.seccion-input-nombre').addClass( 'color_libra_' + _this.color );
          break;
        case 'MINIMO_TAREAS':
          _this.minimo_tareas = (p_parametros.valor != '') ? parseInt(p_parametros.valor) : 0;
          _this._controlar_limites();
          break;
        case 'MAXIMO_TAREAS':
          _this.maximo_tareas = (p_parametros.valor != '') ? parseInt(p_parametros.valor) : 0;
          _this._controlar_limites();
          break;
        case 'observaciones':
          _this.observaciones = p_parametros.valor;
          break;
        default:
          break;
      };

    };

    this._hay_limites = function() {
      var _this = this;
      return ((_this.minimo_tareas > 0) || (_this.maximo_tareas > 0));
    };

    this._controlar_limites = function() {

      var _this = this;

      var v_limite = false;

      if( _this._hay_limites() || app.parametros.contador_tareas_seccion === 'S') {
          
        var v_tareas = _this.$dom.find('.sortable-panel-tareas > .elem-tarea:not(.elem-nueva-tarea)');

        if(app.parametros.contador_tareas_seccion === 'S') _this.$dom.find('.seccion-contador-tareas').html('[' + v_tareas.length + ']');

        if( _this._hay_limites() ) {
          if(_this.minimo_tareas > 0 && _this.minimo_tareas > v_tareas.length) {
            _this.$dom.find('.seccion-limite-minimo').show().find('.num').html( _this.minimo_tareas );
            v_limite = true;
          } else {
            _this.$dom.find('.seccion-limite-minimo').hide();
          };
          if(_this.maximo_tareas > 0 && _this.maximo_tareas < v_tareas.length) {
            _this.$dom.find('.seccion-limite-maximo').show().find('.num').html( _this.maximo_tareas );
            v_limite = true;
          } else {
            _this.$dom.find('.seccion-limite-maximo').hide();
          };
        };

      };

      _this.$dom.toggleClass('alerta-limites', v_limite);
      _this.$dom.find('.seccion-limites').toggle(v_limite);

    };

    this._toJSON =  function() {
      var _this = this;
      return {
        'codigo': _this.codigo,
        'nombre': _this.nombre,
        'color': _this.color,
        'orden': _this.orden,
        'minimo_tareas': (_this.minimo_tareas > 0) ? _this.minimo_tareas : '',
        'maximo_tareas': (_this.maximo_tareas > 0) ? _this.maximo_tareas : '',
        'observaciones': _this.observaciones
      };
    };

    this.columnas_tablero = this._get_opcion_columnas_seccion();
    this.$dom = this._actualizar_dom();

    return this;

  };

  app.tarea_actual = null;

  app._tareas = [];

  app._tarea = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.codigo === 'undefined') return;
    if(typeof p_opciones.secciones === 'undefined') return;

    this.codigo = parseInt(p_opciones.codigo);
    this.status = (p_opciones.status || 'P');
    this.nombre = (p_opciones.nombre || '');
    this.usuario_responsable = (p_opciones.usuario_responsable || '');
    this.fecha_inicio = (p_opciones.fecha_inicio || '');
    this.fecha_entrega = (p_opciones.fecha_entrega || '');
    this.descripcion = (p_opciones.descripcion || '');
    this.prioridad = (p_opciones.prioridad || '');
    this.tarea_padre = (p_opciones.tarea_padre || '');
    this.depende_de_tarea = (p_opciones.depende_de_tarea || '');
    this.fecha_grabacion = (p_opciones.fecha_grabacion || '');
    this.usuario_grabacion = (p_opciones.usuario_grabacion || '');
    this.crm_numero_expediente = (p_opciones.crm_numero_expediente || '');
    this.crm_numero_linea = (p_opciones.crm_numero_linea || '');
    this.fecha_finalizacion = (p_opciones.fecha_finalizacion || '');
    this.usuario_finalizacion = (p_opciones.usuario_finalizacion || '');
    this.secciones = p_opciones.secciones;
    this.subtareas = (p_opciones.subtareas || []);
    this.documentos = (p_opciones.documentos || []);
    this.etiquetas = (p_opciones.etiquetas || []);
    this.comentarios = (p_opciones.comentarios || []);
    this.campos_aux = (p_opciones.campos_aux || {});

    this.$dom = $('<li></li>');
    this.fecha_entrega_color = (this.fecha_entrega != '' && this.status != 'F') ? app.fn._get_color_fecha(this.fecha_entrega) : '';

    this._actualizar_dom = function(p_opciones) {

      var _this = this;

      if(typeof p_opciones === 'undefined') p_opciones = {};
      if(typeof p_opciones.sortable === 'undefined') p_opciones.sortable = (app.fn._puede_ordenar_tareas() || _this.tarea_padre !== '');
      if(typeof p_opciones.buscador === 'undefined') p_opciones.buscador = false;

      _this.modificable = true;

      if(app.proyecto_actual === null) {
        p_opciones.sortable = false;
      } else {
        _this.modificable = (app.proyecto_actual.status != 900);
      };

      // html botones propiedades
      var f_incluir_props = function() {

        v_html.push('<div class="wrapper-btns-prop">');
        if(_this.documentos.length > 0) v_html.push('<button class="btn-prop btn-documentos">' + _this.documentos.length + '<span class="icon icon-paperclip ml1"></span></button>');
        if(_this.comentarios.length > 0) v_html.push('<button class="btn-prop btn-comentarios">' + _this.comentarios.length + '<span class="icon icon-comments ml1"></span></button>');
        if(_this.subtareas.length > 0) v_html.push('<button class="btn-prop btn-subtareas">' + _this.subtareas.length + '<span class="icon icon-code-branch icon-rotate-90 ml1"></span></button>');
        v_html.push('</div>');
        
      };

      // html etiquetas
      var f_incluir_etiquetas = function() {

        if(typeof _this.etiquetas != 'undefined' && _this.etiquetas.length > 0) {
          v_html.push('<ul class="wrapper-tarea-etiquetas mr1">');
          var v_contador = 0;
          for(var e in _this.etiquetas) {
            v_contador += 1;
            if(v_contador > 3) {
              // solo mostramos las 3 primeras etiquetas
              v_html.push('<li class="mas-etiquetas">+' + (_this.etiquetas.length - (v_contador - 1)) + '</li>');
              break;
            };
            var t = app.fn.buscar_por_id(app._etiquetas, 'codigo', _this.etiquetas[e]);
            v_html.push('<li class="etiqueta-' + t.codigo + '" data-etiqueta="' + t.codigo + '" title="' + t.nombre + '">' + t.icono + '</li>');
          };
          v_html.push('</ul>');
        };

      };

      // inicio del html de la tarea

      var v_html = [];
      if(p_opciones.sortable && _this.modificable) {
        v_html.push('<span class="btn-handle"><svg class="drag-icon" focusable="false" viewBox="0 0 24 24"><path d="M10,4c0,1.1-0.9,2-2,2S6,5.1,6,4s0.9-2,2-2S10,2.9,10,4z M16,2c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,2,16,2z M8,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,10,8,10z M16,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,10,16,10z M8,18 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,18,8,18z M16,18c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,18,16,18z"></path></svg></span>');
      } else {
        if(app.vista_actual != 'tablero') v_html.push('<span class="sep"></span>');
      };

      v_html.push('<div class="elem-tarea-wrapper">');

      var v_bnt_finalizar = '';

      if(!_this._dependencia().activa) {
        if(_this.modificable) {
          if(!p_opciones.buscador || _this.tarea_padre === '') {
            v_bnt_finalizar = '<button class="btn-tarea-finalizada icon icon-' + ((_this.status === 'F') ? 'check-circle' : 'circle') + '"></button>';
          } else {
            v_bnt_finalizar = '<button class="btn-tarea-subtarea icon icon-indent"></button>';
          };
        };
      } else {
        v_bnt_finalizar = '<button class="btn-tarea-dependiente icon icon-link"></button>';
      };

      if(_this.tarea_padre === '') {
          
        if(app.vista_actual === 'lista') {
          v_html.push('<div class="elem-tarea-wrapper">' + v_bnt_finalizar + '<div class="elem-tarea-wrapper"><input class="input-dinamico tarea-input-nombre" type="text" maxlength="500" value="' + _this.nombre + '" />');
          if(_this.modificable) v_html.push('<button class="btn-simple btn-hover editar-tarea-input-nombre"><span class="icon icon-text-width"></span></button>');
          v_html.push('</div>');
        } else {
          v_html.push('<div class="tarea-input-nombre">');
          f_incluir_etiquetas();
          v_html.push(v_bnt_finalizar + ' ' + _this.nombre + '</div>');
        };

      } else {

        v_html.push('<div class="elem-tarea-wrapper">' + v_bnt_finalizar + '<div class="elem-tarea-wrapper mt1"><div class="input-dinamico-grow" aria-hidden="true">' + _this.nombre + '</div><textarea class="input-dinamico tarea-input-nombre" maxlength="500">' + _this.nombre.replace(/<br *\/?>/gi, '\n') + '</textarea><button class="btn-simple btn-hover editar-tarea-input-nombre"><span class="icon icon-text-width"></span></button></div>');

      };

      if(app.vista_actual === 'lista' || _this.tarea_padre !== '') f_incluir_props();
      if(app.vista_actual === 'lista' && _this.tarea_padre === '') f_incluir_etiquetas();
      
      v_html.push('<div class="field elem-tarea-props' + ((app.vista_actual === 'tablero') ? ' elem-tarea-props-fijos' : '') + '">');

      v_html.push('<div class="flex flex-1">');

      v_html.push('<div class="input' + ((_this.usuario_responsable === '') ? ' sin-valor' : '') + '">');
      if(_this.usuario_responsable != '') {
        v_html.push('<button class="input-valor">' + app.fn._get_avatar_usuario({'usuario': _this.usuario_responsable, 'clase': 'avatar-s'}) + '</button>');
      } else {
        v_html.push('<button class="btn-input-sin-valor"></button>');
      };
      v_html.push('</div>');
      
      v_html.push('<div class="input ancho-fijo ' + ((_this.fecha_entrega === '') ? ' sin-valor' : '') + '">');
      if(_this.fecha_entrega != '') {
        v_html.push('<button class="input-valor ' + _this.fecha_entrega_color + '">' + _this.fecha_entrega + '</button>');
      } else {
        v_html.push('<button class="btn-input-sin-valor icon icon-calendar"></button>');
      };
      v_html.push('<input class="input-calendario tarea-fecha-entrega ' + _this.fecha_entrega_color + '" type="text" maxlength="10" value="' + _this.fecha_entrega + '"' + ((_this.fecha_inicio != '') ? ' data-indicacion="MIN:' + _this.fecha_inicio + '"' : '') + ' />');
      if(_this.modificable) v_html.push('<button class="btn-limpiar-campo icon icon-times-circle"></button>');
      v_html.push('</div>');

      v_html.push('</div>');

      if(app.proyecto_actual != null && app.proyecto_actual.gestiona_expedientes === 'S' && _this.tarea_padre === '') {
        v_html.push('<div class="flex">');
        v_html.push('<div class="input">');
        v_html.push('<p class="tarea-expediente tar">' + _this.crm_numero_expediente + '</p>');
        v_html.push('</div>');
        v_html.push('</div>');
      };

      v_html.push('</div>');

      var v_aplica_color_tarea = '';

      if(app.proyecto_actual != null && _this.tarea_padre === '') {

        if(app.vista_actual === 'tablero') v_html.push('<div class="break-flex-row"></div>');

        var v_html_aux = [];
        var v_hay_algun_valor = false;

        for(var c in app.proyecto_actual.campos_aux) {
          
          var v_campo = app.proyecto_actual.campos_aux[c];
          if(typeof v_campo.mostrar_en_lista === 'undefined') v_campo.mostrar_en_lista = 'N';
          v_campo.valor = '';

          var v_color = '';

          if(v_campo.activo === 'S' && app.agrupacion != v_campo.campo) {
            
            var v_valor = '';
            var v_alinear = (v_campo.tipo === 'N') ? 'tar' : 'tal';

            if(!app.fn.esta_vacio(_this.campos_aux) && typeof _this.campos_aux[app.proyecto_actual.codigo] != 'undefined') v_campo.valor = (_this.campos_aux[app.proyecto_actual.codigo][v_campo.campo] || '');

            if(v_campo.tipo === 'S') {
              v_alinear = 'tac';
              if(v_campo.valor != '') {
                var aux = app.fn.buscar_por_id(app.proyecto_actual.campos_aux, 'campo', v_campo.campo);
                var val = app.fn.buscar_por_id(aux.valores, 'codigo', parseInt(v_campo.valor));
                v_valor = val.valor;
                v_color = (typeof val.color != 'undefined' && val.color != '') ? val.color.toLowerCase() : '';
              };
              v_valor = '<button data-tarea="' + _this.codigo + '" data-campo-aux="' + v_campo.campo + '" class="menu-contextual-campo-aux' + ((v_color != '') ? ' color_libra_' + v_color + '_bg' : '') + '">' + v_valor + '</button>';
            } else {
              if(v_campo.tipo === 'N' && v_campo.valor != '') {
                v_valor = app.fn.texto_a_numero(v_campo.valor);
              } else if(v_campo.tipo === 'L' && v_campo.valor != '') {
                var v = app.fn.buscar_por_id(v_campo.valores, 'codigo', v_campo.valor);
                if(v != null) v_valor = v.descripcion;
              } else {
                v_valor = v_campo.valor;
              };
              v_valor = '<span>' + v_valor + '</span>';
            };

            if(app.vista_actual === 'tablero') v_alinear = '';

            if(v_campo.mostrar_en_lista === 'S') {
              
              if(app.vista_actual !== 'tablero' || (!app.fn.es_nulo(v_campo.valor) || v_campo.tipo === 'S')) v_hay_algun_valor = true;

              v_html_aux.push('<div class="field elem-tarea-props">');
              v_html_aux.push('<div class="input ancho-fijo">');
              v_html_aux.push('<p class="tarea-campo-aux ' + v_alinear + '">' + v_valor + '</p>');
              v_html_aux.push('</div>');
              v_html_aux.push('</div>');

            };

            if(v_color != '' && v_campo.aplica_color_tarea === 'S') v_aplica_color_tarea = v_color;

          };

        };

        if(v_hay_algun_valor) v_html.push( v_html_aux.join('') );

      };

      if(app.vista_actual === 'tablero' && _this.tarea_padre === '') {
        v_html.push('<div class="elem-tarea-wrapper wrapper-props-tags">');
        f_incluir_props();
        v_html.push('</div>');
      };

      v_html.push('</div>');

      _this.$dom.empty().removeAttr('style').removeClass().addClass('elem-tarea menu-contextual-tarea data-tarea' + ((v_aplica_color_tarea != '') ? ' color_libra_' + v_aplica_color_tarea + '_bd' : '')).append(v_html.join('')).data('tarea', _this.codigo).show();

      if(_this.status === 'F') _this.$dom.addClass('tarea-finalizada');

      if(app.tarea_actual != null && _this.codigo === app.tarea_actual.codigo) _this.$dom.addClass('tarea-seleccionada');

      return _this._aplicar_eventos( _this.$dom );

    };

    this._get_proyecto = function() {

      var _this = this;

      var v_proyecto_tarea;

      var v_secciones = Object.keys(_this.secciones);
      if(v_secciones.length === 1) {
        v_proyecto_tarea = app.fn.buscar_por_id(app._proyectos, 'codigo', parseInt(v_secciones[0]));
      };

      return v_proyecto_tarea;
      
    };

    this._detalle_tarea = function() {

      var _this = this;

      var v_proyecto_tarea = {'tipo': 'U'};
      if(app.proyecto_actual != null) {
        v_proyecto_tarea = app.proyecto_actual;
      } else {
        v_proyecto_tarea = _this._get_proyecto();
      };

      if(typeof _this.modificable === 'undefined') _this.modificable = (v_proyecto_tarea.status != 900);

      var v_dependencia = _this._dependencia();

      var v_html = ['<header class="detalle-tarea-header status-' + _this.status.toLowerCase() + ' flex"><div class="flex-1">'];

      if(_this.modificable) {
        if(_this.status === 'F') {
          v_html.push('<p class="msg-tarea-finalizada"><button class="btn-simple btn-hover btn-finalizar-tarea"><span class="icon icon-check-circle mr1"></span>' +  app.opts.lang.msg_tarea_finalizada + '</button></p>');
        } else {
          if(!v_dependencia.activa) v_html.push('<button class="btn-simple btn-hover btn-finalizar-tarea"><span class="icon icon-check-circle mr1"></span>' +  app.opts.lang.finalizar + '</button>');
        };
      };

      v_html.push('</div><div class="detalle-tarea-acciones flex-initial">');
      if(_this.modificable) v_html.push('<button class="btn-simple btn-hover btn-adjuntar-archivos icon icon-paperclip ml1"></button><button class="btn-simple btn-hover btn-insertar-subtarea icon icon-code-branch icon-rotate-90 ml1"></button><button class="btn-simple btn-hover btn-acciones-tarea menu-contextual-tarea icon icon-ellipsis-h" data-tarea="' + _this.codigo + '"></button>');
      if(!app.llamada_directa) v_html.push('<button class="btn-simple btn-hover btn-cerrar-tarea icon icon-times"></button>');
      v_html.push('</div></header><article class="detalle-tarea-article">');

      if(v_dependencia.activa) {
        v_html.push('<div class="msg-aviso-dependencia"><div><span class="icon icon-link mr1"></span>' + app.opts.lang.depende_de + '<button class="btn-navegar-tarea-dependiente" data-tarea="' + v_dependencia.tarea.codigo + '">' + v_dependencia.tarea.nombre + '</button></div><button class="btn-eliminar-dependencia" data-tarea="' + _this.codigo + '"><span class="icon icon-unlink"></span></button></div>');
      };
      
      v_html.push('<section class="detalle-tarea-bloque">');

      if(_this.tarea_padre != '') {
        var p = app.fn.buscar_por_id(app._tareas, 'codigo', _this.tarea_padre);
        v_html.push('<button class="btn-navegar-tarea-padre" data-tarea="' + _this.tarea_padre + '"><span class="icon icon-angle-double-left mr1"></span>' + p.nombre + '</button>');
      };

      // nombre tarea
      v_html.push('<div class="field d100"><div class="input-dinamico-grow" aria-hidden="true">' + _this.nombre + '</div><textarea class="input-dinamico tarea-input-nombre" maxlength="500">' + _this.nombre + '</textarea></div>');

      if(app.proyecto_actual === null) {
        var p = _this._get_proyecto();
        v_html.push('<div class="field d100"><div class="label"><label>' + app.opts.lang.proyecto + '</label></div><div class="input">');
        v_html.push('<button class="btn-hover btn-navegar-proyecto color_libra_' + p.color + '_bg" data-proyecto="' + p.codigo + '">' + p.nombre + '</button>');
        v_html.push('</div></div>');
      };

      // expediente bpm
      if(_this.crm_numero_expediente != '') {
        v_html.push('<div class="field d100"><div class="label"><label>' + app.opts.lang.crm_numero_expediente + '</label></div><div class="input input-full tarea-expediente"></div></div>');
      };

      // usuario responsable
      if(v_proyecto_tarea.tipo != 'U' && v_proyecto_tarea.usuarios.length > 0) {

        v_html.push('<div class="field d100"><div class="label"><label>' + app.opts.lang.usuario_responsable + '</label></div><div class="input' + ((_this.usuario_responsable === '') ? ' sin-valor' : '') + '"">');
        if(_this.usuario_responsable != '') {
          var v_usuario = app.fn.buscar_por_id(v_proyecto_tarea.usuarios, 'usuario', _this.usuario_responsable);
          if(typeof v_usuario.d_usuario === 'undefined') v_usuario.d_usuario = app.fn._get_nombre_usuario(v_usuario.usuario);
          v_html.push('<button class="input-valor btn-input-usuario-responsable">' + app.fn._get_avatar_usuario({'usuario': v_usuario.usuario, 'alt': v_usuario.d_usuario, 'clase': 'avatar-s mr1'}) + '<span class="mr1">' + v_usuario.d_usuario + '</span>');
          if(_this.modificable) v_html.push('<span class="btn-limpiar-campo icon icon-times-circle bnt-eliminar-usuario-responsable"></span>');
          v_html.push('</button>');
        } else {
          v_html.push('<button class="btn-input-sin-valor btn-input-ins-valor icon icon-user"></button>');
        };
        v_html.push('<input class="input-etiqueta tarea-usuario-responsable" type="text" maxlength="100" value="" /></div></div>');

      };

      
      v_html.push('<div class="field d100' + ((_this.fecha_inicio != '') ? ' con-fecha-inicio' : '') + '">');
      
      // fecha inicio
      v_html.push('<div class="d50 wrapper-fecha-inicio"><div class="label"><label>' + app.opts.lang.fecha_inicio + '</label></div><div class="input' + ((_this.fecha_inicio === '') ? ' sin-valor' : '') + '">');
      if(_this.fecha_inicio != '') {
        v_html.push('<button class="input-valor">' + _this.fecha_inicio + '</button>');
      } else {
        v_html.push('<button class="btn-input-sin-valor icon icon-calendar"></button>');
      };
      v_html.push('<input class="input-calendario tarea-fecha-inicio" type="text" maxlength="10" value="' + _this.fecha_inicio + '"' + ((_this.fecha_entrega != '') ? ' data-indicacion="MAX:' + _this.fecha_entrega + '"' : '') + ' />');
      if(_this.modificable) v_html.push('<button class="btn-limpiar-campo icon icon-times-circle"></button>');
      v_html.push('</div></div>');

      // fecha entrega
      v_html.push('<div class="d50 wrapper-fecha-entrega"><div class="label"><label>' + app.opts.lang.fecha_entrega + '</label></div><div class="input' + ((_this.fecha_entrega === '') ? ' sin-valor' : '') + '">');
      if(_this.fecha_entrega != '') {
        v_html.push('<button class="input-valor ' + _this.fecha_entrega_color + '">' + _this.fecha_entrega + '</button>');
      } else {
        v_html.push('<button class="btn-input-sin-valor icon icon-calendar"></button>');
      };
      v_html.push('<input class="input-calendario tarea-fecha-entrega" type="text" maxlength="10" value="' + _this.fecha_entrega + '"' + ((_this.fecha_inicio != '') ? ' data-indicacion="MIN:' + _this.fecha_inicio + '"' : '') + ' />');
      if(_this.modificable) v_html.push('<button class="btn-limpiar-campo icon icon-times-circle"></button>');
      v_html.push('</div></div>');

      v_html.push('</div>');

      // tarea padre
      if(_this.tarea_padre === '') {

        v_html.push('<div class="field d100"><div class="label"><label>' + app.opts.lang.etiquetas + '</label></div><div class="input-wrapper"><ul class="lista-etiquetas">');
        if(_this.etiquetas.length > 0) {
          for(var e in _this.etiquetas) {
            var t = app.fn.buscar_por_id(app._etiquetas, 'codigo', _this.etiquetas[e]);
            v_html.push('<li class="tarea-etiqueta etiqueta-' + t.codigo + ((t.color != '') ? ' color_libra_' + t.color + '_bg' : '') + '" data-etiqueta="' + t.codigo + '">' + t.nombre + '<button class="btn-del-tarea-etiqueta"><span class="icon icon-times"></span></button></li>');
          };
        };
        v_html.push('</ul><button class="btn-input-ins-valor icon icon-tags"></button>');
        v_html.push('<input class="input-etiqueta tarea-etiqueta" type="text" maxlength="100" value="" /></div></div>');

      };

      // descripcion
      v_html.push('<div class="field d100"><div class="label"><label>' + app.opts.lang.descripcion + '</label></div><div class="textarea richeditor" rel="tarea-descripcion"><textarea id="tarea-descripcion" name="tarea-descripcion" class="richeditor-textarea oculto"></textarea>' + app.fn.generar_loader() + '</div></div>');

      if(v_proyecto_tarea != null && _this.tarea_padre === '') {
        if(v_proyecto_tarea.campos_aux.length > 0) v_html.push('<br />');
        for(var c in v_proyecto_tarea.campos_aux) {
          
          var v_campo = v_proyecto_tarea.campos_aux[c];
          if(v_campo.activo === 'S') {
              
            var v_valor = '';

            if(!app.fn.esta_vacio(_this.campos_aux) && typeof _this.campos_aux[v_proyecto_tarea.codigo] != 'undefined') {
              v_valor = (_this.campos_aux[v_proyecto_tarea.codigo][v_campo.campo] || '');
              if(v_campo.tipo === 'S'&& v_valor != '') {
                var aux = app.fn.buscar_por_id(v_proyecto_tarea.campos_aux, 'campo', v_campo.campo);
                var val = app.fn.buscar_por_id(aux.valores, 'codigo', parseInt(v_valor));
                v_valor = (typeof val.color != 'undefined' && val.color != '') ? '<span class="color_libra_' + val.color.toLowerCase() + '_bg">' + val.valor + '</span>' : val.valor;
              };
            };

            v_html.push('<div class="campo-aux field d100">');
            v_html.push('<div class="label"><label');
            if(!app.fn.es_nulo(v_campo.descripcion)) v_html.push(' title="' + v_campo.descripcion + '"');
            v_html.push('>' + v_campo.nombre + '</label></div>');
            v_html.push('<div class="input">');
            if(v_campo.tipo !== 'S') {
              v_html.push('<input id="campo_aux_' + v_campo.campo + '" data-campo-aux="' + v_campo.campo + '" class="input-campo-aux visible');
              if(v_campo.tipo !== 'N') {
                v_html.push('" maxlength="500" value="' + v_valor + '" type="text"');
              } else {
                v_valor = app.fn.texto_a_numero(v_valor);
                v_html.push(' maxlength="20" value="' + v_valor + '" type="number"');
                if(app.es.Android && app.es.layout === "Gecko") v_html.push(' pattern="[0-9]+([\.,][0-9]+)?" lang="en-us"');
              };
              v_html.push(' autocomplete="off" />');
              if(v_campo.tipo === 'L') v_html.push('<input id="d_campo_aux_' + v_campo.campo + '" name="d_campo_aux_' + v_campo.campo + '" type="text" class="d_filtro visible" disabled=""><div class="btn-wrapper"><button tabindex="-1" class="icon icon-search lov"><span class="noicon">...</span></button></div>');
            } else if(v_campo.tipo === 'S') {
              if(v_valor === '') v_valor = '-';
              v_html.push('<button data-campo-aux="' + v_campo.campo + '" class="menu-contextual-campo-aux">' + v_valor + '</button>');
            }
            v_html.push('</div>');
            v_html.push('</div>');

          };

        };
      };

      v_html.push('<div class="detalle-tarea-bloque-wrapper"></div>');

      v_html.push('</section>');

      v_html.push('<div class="detalle-tarea-subtareas"><div class="flex"><h3>' + app.opts.lang.subtareas + '</h3><div class="subtareas-progreso"></div></div><ul class="sortable-panel sortable-panel-subtareas"></ul></div>');

      v_html.push('<div class="detalle-tarea-documentos"><section class="tarea-documentos-lista">' + app.fn.generar_loader({'tipo': 'mwldoc-listado', 'numero_lineas': _this.documentos.length}) + '</section><div class="dropfiles' + ((!_this.modificable) ? ' oculto' : '') + '" id="tarea-documentos-drop">');
      if(_this.modificable) v_html.push('<span class="ed-upload icon-upload"></span>');
      v_html.push('</div></div>');

      v_html.push('<div class="detalle-tarea-actividad"><section class="tarea-actividad-lista"><ul class="lista-actividad clr"><li class="actividad"><div class="actividad-contenido">' + app.fn._get_avatar_usuario({'usuario': _this.usuario_grabacion}) + '<div class="actividad-wrapper mt1 ml1"><header><div class="actividad-titulo"><p class="actividad-usuario">' + _this.usuario_grabacion + ' ' + app.opts.lang.act_creacion_tarea + ' <button class="btn-simple btn-hover btn-codigo-tarea" data-clipboard-text="' + window.location.href + '?tarea=' + _this.codigo + '">#' + _this.codigo + '</button></p><p class="actividad-fecha">' + _this.fecha_grabacion + '</p></div><div class="actividad-acciones"><span class="icon icon-check-double"></span></div></header></div></div></li>' + app.fn.generar_loader({'tipo': 'mwldoc-listado', 'numero_lineas': _this.comentarios.length}) + '</ul><ul class="lista-historial clr"></ul></section></div>');

      v_html.push('</article>');
      if(_this.modificable) v_html.push('<footer class="detalle-tarea-footer"><div class="comentarios-wrapper-responder">' + app.fn._get_avatar_usuario({'usuario': app.opts.usuario.usuario}) + '<div class="respuesta"><button class="editable" data-tarea="' + _this.codigo + '">' + app.opts.lang.escribir_comentario + '</button></div></div></footer>');

      app.tpl.gtd.detalle_tarea.find('.detalle-tarea-wrapper').empty().append( v_html.join('') );

      _this._aplicar_eventos( app.tpl.gtd.detalle_tarea.find('.detalle-tarea-wrapper') );

      app.fn.pintar_subtareas({'tarea': _this});

    };

    this._aplicar_eventos = function($el) {

      var _this = this;

      if(_this.modificable) {

        // NOMBRE

        $el.off('focus', '.tarea-input-nombre').on('focus', '.tarea-input-nombre', function(e) {

          app.fn.desactivar_timeout();

        }).off('focusout', '.tarea-input-nombre').on('focusout', '.tarea-input-nombre', function(e) {

          var t = $(this).closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
            var v_val = $(this).val();
            if(t.nombre === v_val) app.fn.activar_timeout();
          };

        }).off('change', '.tarea-input-nombre').on('change', '.tarea-input-nombre', function(e) {
          
          if(typeof app.peticion_actual != 'undefined') return;

          e.preventDefault();

          var t = $(this).closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
              
            var v_val = $(this).val();

            if(v_val != '' && v_val != t.nombre) {

              app.fn.upd_tarea({
                'tarea': t,
                'campo': 'NOMBRE',
                'valor': v_val
              });

            } else {
              $(this).val( t.nombre );
              app.fn.activar_timeout();
            };

          };

          return false;

        }).off('click', '.elem-tarea-wrapper .tarea-input-nombre').on('click', '.elem-tarea-wrapper .tarea-input-nombre', function(e) {

          e.preventDefault();
          var t = $(this).closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
            app.fn.mostrar_detalle_tarea({'tarea': t});
            $(this).blur();
          };
          return false;

        }).off('keydown', 'textarea.tarea-input-nombre').on('keydown', 'textarea.tarea-input-nombre', function(e) {

          if(e.keyCode === 13) { 
            e.preventDefault();
            $(this).trigger('change');
            return false;
          };

        }).off('keyup', 'textarea.tarea-input-nombre').on('keyup', 'textarea.tarea-input-nombre', function(e) {

          if(e.keyCode !== 13) { 
            var v_val = $(this).val();
            $(this).parent().find('.input-dinamico-grow').html( v_val );
            return false;
          };

        });

        $el.off('click', '.editar-tarea-input-nombre').on('click', '.editar-tarea-input-nombre', function(e) {

          e.preventDefault();
          $el.find('.tarea-input-nombre').focus().select();
          return false;

        });

        // EXPEDIENTE
        $el.off('click', '.gtd-panel-detalle-tarea .tarea-expediente').on('click', '.gtd-panel-detalle-tarea .tarea-expediente', function(e){
          var $this = $(this);
          $this.contextMenu();
        });

        // FECHA INICIO
        $el.off('blur', '.tarea-fecha-inicio').on('blur', '.tarea-fecha-inicio', function(e) {

          var t = $(this).closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
              
            var v_val = $(this).val();

            if(v_val != t.fecha_inicio) {
              app.fn.upd_tarea({
                'tarea': t,
                'campo': 'FECHA_INICIO',
                'valor': v_val
              });
            } else {
              app.fn.activar_timeout();
            };

          };

          return false;

        });

        // FECHA ENTREGA
        $el.off('blur', '.tarea-fecha-entrega').on('blur', '.tarea-fecha-entrega', function(e) {

          var t = $(this).closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
              
            var v_val = $(this).val();

            if(v_val != t.fecha_entrega) {
              app.fn.upd_tarea({
                'tarea': t,
                'campo': 'FECHA_ENTREGA',
                'valor': v_val
              });
            } else {
              app.fn.activar_timeout();
            };

          };

          return false;

        });

        $el.off('blur', '.tarea-usuario-responsable').on('blur', '.tarea-usuario-responsable', function(e) {

          app.$this = $(this);
          setTimeout(function() {

            app.$this.val('');
            app.$this.parent().find('.btn-input-usuario-responsable,.btn-input-sin-valor').show();
            $('#lista-usuarios-autocompletado').remove();

            delete app.$this;

          }, 200);

        });

        $el.off('blur', '.tarea-etiqueta').on('blur', '.tarea-etiqueta', function(e) {

          app.$this = $(this);
          setTimeout(function() {

            var t = app.$this.removeClass('visible').closest('.data-tarea').data('tarea');
            if(!app.fn.es_nulo(t)) {
              t = app.fn._get_tarea(t);
                
              var v_val = app.$this.val();

              if(v_val != '' && v_val.length > 2) {
                  app.fn.ins_tarea_etiqueta({
                  'tarea': t,
                  'etiqueta': '',
                  'nombre': v_val
                });
              } else {
                app.fn.activar_timeout();
              };

              app.$this.val('');
              app.$this.parent().find('.btn-input-ins-valor').show();
              $('#lista-etiqueta-autocompletado').remove();

              delete app.$this;

            };

          }, 200);

        });

        $el.off('click', '.btn-del-tarea-etiqueta').on('click', '.btn-del-tarea-etiqueta', function(e){
          e.preventDefault();
          var $this = $(this);
          var t = $this.removeClass('visible').closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
            var e = $this.parent().data('etiqueta');
            app.fn.del_tarea_etiqueta({'tarea': t, 'etiqueta': e, '$el': $this.parent()});
          };
          return false;
        });

        $el.off('click', '.detalle-tarea-footer .respuesta > button.editable').on('click', '.detalle-tarea-footer .respuesta > button.editable', function(e){
          e.preventDefault();
          app.fn.escribir_comentario({'tarea': app.tarea_actual.codigo});
          return false;
        });

        $el.off('click', '.btn-tarea-finalizada').on('click', '.btn-tarea-finalizada', function(e){
          
          e.preventDefault();
          var t = $(this).closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
            app.fn.cambiar_status_tarea({'tarea': t});
          };
          return false;

        });

        $el.off('click', '.btn-finalizar-tarea').on('click', '.btn-finalizar-tarea', function(e){

          e.preventDefault();
          app.fn.cambiar_status_tarea({'tarea': app.tarea_actual});
          return false;

        });

        $el.off('click', '.btn-eliminar-dependencia').on('click', '.btn-eliminar-dependencia', function(e){

          e.preventDefault();
          var t = $(this).data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
            app.fn.eliminar_dependencia({'tarea': t});
          };
          return false;

        });
        $el.find('.btn-eliminar-dependencia').tooltip(app.opts.lang.eliminar_dependencia);

        $el.off('click', '.btn-adjuntar-archivos').on('click', '.btn-adjuntar-archivos', function(e){

          e.preventDefault();
          $el.find('.dropfiles').trigger('click');
          return false;

        });
        $el.find('.btn-adjuntar-archivos').tooltip(app.opts.lang.archivos);

        $el.off('click', '.btn-insertar-subtarea').on('click', '.btn-insertar-subtarea', function(e){

          e.preventDefault();
          $el.find('.btn-nueva-tarea').trigger('click');
          return false;

        });
        $el.find('.btn-insertar-subtarea').tooltip(app.opts.lang.agregar_subtarea);

        $el.off('click', '.btn-acciones-tarea').on('click', '.btn-acciones-tarea', function(e){

          e.preventDefault();
          $this = $(this);
          $this.contextMenu();
          return false;

        });
        $el.find('.btn-acciones-tarea').tooltip(app.opts.lang.mas_acciones);

        $el.off('click', '.menu-contextual-campo-aux').on('click', '.menu-contextual-campo-aux', function(e){

          e.preventDefault();
          $this = $(this);
          $this.contextMenu();
          return false;

        });

        $el.off('focus', '.input-campo-aux').on('focus', '.input-campo-aux', function(e) {
          app.fn.desactivar_timeout();
        }).off('focusout', '.input-campo-aux').on('focusout', '.input-campo-aux', function(e) {
          app.fn.activar_timeout();
        }).off('change', '.input-campo-aux').on('change', '.input-campo-aux', function(e) {
          
          if(typeof app.peticion_actual != 'undefined') return;

          e.preventDefault();

          var $el = $(this);
          var v_campo = $el.data('campo-aux');
          var v_valor = $el.val();

          if($el.hasClass('lv') && !app.fn.es_nulo(v_valor)) return;

          var v_attr_type = $el.attr('type');
          if(v_attr_type === 'number') v_valor = v_valor.toString().replace(',', app.opts.mask.smbd).replace('.', app.opts.mask.sdbd);

          app.fn.set_tarea_campo_aux({
            'tarea': app.tarea_actual.codigo,
            'campo': v_campo,
            'valor': v_valor
          });

          return false;

        }).off('keydown', '.input-campo-aux').on('keydown', '.input-campo-aux', function(e) {

          if(e.keyCode === 13) { 
            e.preventDefault();
            $(this).trigger('change');
            return false;
          };

        });

        app.fn._aplicar_eventos_generales($el);

      } else {

        $el.find('textarea.tarea-input-nombre').attr('disabled', true);
        $el.find('.btn-input-ins-valor, .btn-input-sin-valor').remove();

      };

      $el.find('.btn-navegar-tarea-padre, .btn-navegar-tarea-dependiente').off('click').on('click', function(e){
        e.preventDefault();
        var t = $(this).data('tarea');
        if(!app.fn.es_nulo(t)) {
          t = app.fn._get_tarea(t);
          app.fn.mostrar_detalle_tarea({'tarea': t});
        };
        return false;
      });

      $el.find('.wrapper-tarea-etiquetas > li').tooltip();

      $el.off('click', '.btn-navegar-proyecto').on('click', '.btn-navegar-proyecto', function(e){
        e.preventDefault();
        var v_codigo = $(this).data('proyecto');
        var el = app.fn.buscar_por_id(app._proyectos, 'codigo', parseInt(v_codigo));
        app.fn.ocultar_detalle_tarea();
        if(app.llamada_directa) {
          app.tpl.gtd.menu.show();
          app.tpl.gtd.filtros.show();
          app.tpl.gtd.detalle_tarea.addClass('panel-lateral');
          app.llamada_directa = false;
        };
        app.fn.cambiar_proyecto(el);
        return false;
      });

      $el.find('.campo-aux .label > label').tooltip();

      $el.off('click', '.btn-cerrar-tarea').on('click', '.btn-cerrar-tarea', function(e){

        e.preventDefault();
        app.fn.ocultar_detalle_tarea();
        return false;

      });

      // listas de valores
      var v_proyecto_tarea = (app.proyecto_actual != null) ? app.proyecto_actual : _this._get_proyecto();
      if(v_proyecto_tarea != null && app.tarea_actual != null && _this.tarea_padre === '') {
        
        for(var c in v_proyecto_tarea.campos_aux) {
          
          var v_campo = v_proyecto_tarea.campos_aux[c];
          if(v_campo.activo === 'S' && v_campo.tipo === 'L') {

            $('#campo_aux_' + v_campo.campo).not('.lv').addClass('lv').off('keydown').removeClass('loverror').lov({
              'token': app.token,
              'lista': v_campo.lista_valores,
              'icono': true,
              'validate': true,
              'valor_auto': 'N',
              'forzar_validacion': false,
              'campo': 'campo_aux_' + v_campo.campo,
              'callback': function(p_valor, p_campo) {

                if(app.tarea_actual === null) return;
                
                var v_id = p_campo.replace('campo_aux_', '');
                if(app.fn.esta_vacio(app.tarea_actual.campos_aux) || typeof app.tarea_actual.campos_aux[v_proyecto_tarea.codigo] === 'undefined' || p_valor != app.tarea_actual.campos_aux[v_proyecto_tarea.codigo][v_id]) {
                  
                  app.fn.set_tarea_campo_aux({
                    'tarea': app.tarea_actual.codigo,
                    'campo': p_campo.replace('campo_aux_', ''),
                    'valor': p_valor
                  });

                };
              }});

          };

        };
      };

      return $el;

    };

    this._actualizar_campo = function(p_parametros) {

      var _this = this;

      switch (p_parametros.campo) {
        case 'NOMBRE':
          _this.nombre = p_parametros.valor;
          break;
        case 'FECHA_INICIO':
          _this.fecha_inicio = p_parametros.valor;
          break;
        case 'FECHA_ENTREGA':
          _this.fecha_entrega = p_parametros.valor;
          _this.fecha_entrega_color = (_this.fecha_entrega != '' && _this.usuario_finalizacion === '') ? app.fn._get_color_fecha(_this.fecha_entrega) : '';
          break;
        case 'USUARIO_RESPONSABLE':
          _this.usuario_responsable = p_parametros.valor;
          break;
        case 'DESCRIPCION':
          _this.descripcion = p_parametros.valor_clob;
          break;
        case 'STATUS':
          _this.status = p_parametros.valor;
          _this.fecha_finalizacion = (_this.status === 'F') ? moment().format(app.opts.mask.fecha) : '';
          _this.usuario_finalizacion = (_this.status === 'F') ? app.opts.usuario.usuario : '';
          break;
        case 'DEPENDE_DE_TAREA':
          _this.depende_de_tarea = p_parametros.valor;
          break;
        case 'CRM_EXPEDIENTE_LINEA':
          if(p_parametros.valor === '' || p_parametros.valor === '#') {
            _this.crm_numero_expediente = '';
            _this.crm_numero_linea = '';
          } else {
            _this.crm_numero_expediente = p_parametros.valor.split('#')[0];
            _this.crm_numero_linea = p_parametros.valor.split('#')[1];
          };
          break;
        case 'CAMPO_AUX':
          var v_proyecto_tarea = (app.proyecto_actual != null) ? app.proyecto_actual : _this._get_proyecto();
          if(typeof _this.campos_aux[v_proyecto_tarea.codigo] === 'undefined') _this.campos_aux[v_proyecto_tarea.codigo] = {};
          _this.campos_aux[v_proyecto_tarea.codigo][p_parametros.codigo] = p_parametros.valor;
          break;
        default:
          break;
      };

      _this._actualizar_dom();

      if(p_parametros.campo === 'STATUS') {

        app.fn._actualizar_dependencias_tareas({'tarea_principal': _this.codigo});

        if(_this.tarea_padre === '' && app.parametros.filtro_status_tarea != 'T' && app.parametros.filtro_status_tarea != _this.status) {
        
          _this.$dom.hide();
          if(app.tarea_actual != null && app.tarea_actual.codigo === _this.codigo) app.fn.ocultar_detalle_tarea();

        };

      };

      if(p_parametros.campo === 'USUARIO_RESPONSABLE') app.fn.procesar_buscador_usuario_responsable();

      if(app.tarea_actual != null) {
        if(app.tarea_actual.codigo === _this.codigo && p_parametros.campo != 'DESCRIPCION') {
          app.fn.preparar_dom_detalle_tarea();
        } else {
          if(_this.tarea_padre != '') app.tarea_actual._refrescar_progreso_subtareas();
        };
      };

      if(app.vista_actual != 'calendario') {
        sortable('.sortable-panel-tareas', 'reload');
      } else {
        app.fn.crear_entradas_calendario();
      };

    };

    this._get_tarea_origen = function() {

      var _this = this;

      if(_this.tarea_padre !== '') {
        var t = app.fn._get_tarea( _this.tarea_padre );
        return t._get_tarea_origen();
      } else {
        return _this;
      };

    };

    this._get_campo_ordenacion = function( p_valor_defecto ) {

      var _this = this;
      if(typeof p_valor_defecto === 'undefined') p_valor_defecto = _this.codigo;
      var v_campo_ordenacion = null;

      switch(app.ordenacion.campo) {
        case '':
          v_campo_ordenacion = p_valor_defecto;
          break;
        case 'fecha_entrega':
          v_campo_ordenacion = _this.fecha_entrega;
          break;
        case 'usuario_responsable':
          v_campo_ordenacion = _this.usuario_responsable;
          break;
        case 'crm_expediente_linea':
          v_campo_ordenacion = _this.crm_numero_expediente.toString() + _this.crm_numero_linea.toString();
          if(!app.fn.es_nulo(v_campo_ordenacion)) v_campo_ordenacion = parseInt(v_campo_ordenacion);
          break;
        default:
          if(app.proyecto_actual != null && typeof _this.campos_aux[app.proyecto_actual.codigo] != 'undefined' && _this.campos_aux[app.proyecto_actual.codigo][app.ordenacion.campo] != '') {
            var v_valor_campo = _this.campos_aux[app.proyecto_actual.codigo][app.ordenacion.campo];
            if(!app.fn.es_nulo(v_valor_campo) && app.ordenacion.tipo === 'NUMBER') {
              var ca = app.fn.buscar_por_id(app.proyecto_actual.campos_aux, 'campo', app.ordenacion.campo);
              var va = app.fn.buscar_por_id(ca.valores, 'codigo', parseInt(v_valor_campo));
              v_campo_ordenacion = va.orden;
            } else {
              v_campo_ordenacion = v_valor_campo;
            };
          };
      };

      if(typeof v_campo_ordenacion === 'undefined') v_campo_ordenacion = null;
      if(v_campo_ordenacion === null && app.ordenacion.tipo === 'NUMBER') v_campo_ordenacion = -999999999999;

      return v_campo_ordenacion;

    };

    this._refrescar_progreso_subtareas = function() {

      var _this = this;

      var v_html = [];
      if(typeof app.ob.progress_bar != 'undefined' && _this.subtareas.length > 0) {
        var v_finalizadas = app.tpl.gtd.detalle_tarea.find('.detalle-tarea-subtareas').find('.tarea-finalizada').length;
        var v_porc = Math.round( (v_finalizadas * 100) / _this.subtareas.length );
        var pb = new app.ob.progress_bar();
        pb.init({'porcentaje': v_porc, 'color': '#669900', 'textos_barra':{'izquierda': '','derecha': v_porc + '%'}});
        pb.generar();
        v_html.push( pb.dom.progress_bar[0].outerHTML );
      };

      app.tpl.gtd.detalle_tarea.find('.subtareas-progreso').empty().append( v_html.join('') );

    };

    this._dependencia = function() {

      var _this = this;

      var v_dependiente = {'activa': false};

      if(_this.depende_de_tarea != '') {
        v_dependiente.tarea = app.fn.buscar_por_id(app._tareas, 'codigo', _this.depende_de_tarea);
        if(v_dependiente.tarea === null || v_dependiente.tarea.status != 'F') v_dependiente.activa = true;
      };

      return v_dependiente;

    };

    return this;

  };

  app._etiquetas = [];

  app._etiqueta = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.codigo === 'undefined') return;
    if(typeof p_opciones.nombre === 'undefined') return;

    this.codigo = p_opciones.codigo;
    this.nombre = (p_opciones.nombre || '');
    this.color = (p_opciones.color || '').toLowerCase();

    this.secciones = [];

    this._generar_icono = function() {
      return '<svg style="fill:' + app.fn.obtener_color_hex(this.color) + '" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M29.2,14.3L18.7,3.8C17.6,2.6,16,2,14.4,2H7.3C4.4,2,2,4.4,2,7.3v7.1c0,1.6,0.6,3.2,1.8,4.3l10.5,10.5c1.2,1.2,2.8,1.8,4.3,1.8c1.6,0,3.1-0.6,4.3-1.8l6.3-6.3C31.6,20.5,31.6,16.7,29.2,14.3z M10,13c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3S11.7,13,10,13z"></path></svg>';
    };

    this.icono = this._generar_icono();

    this._actualizar_campo = function(p_parametros) {

      var _this = this;

      switch (p_parametros.campo) {
        case 'NOMBRE':
          _this.nombre = p_parametros.valor;
          break;
        case 'COLOR':
          _this.color = p_parametros.color.toLowerCase();
          _this._generar_icono();
          break;
        default:
          break;
      };


    };

    this._cambiar_color = function() {

      var _this = this;

      app.fn.erp_lanzar_lv({'selector_color': true,'callback': function(p_valor){
        if(p_valor != 'X' && p_valor != _this.color) {
          app.fn.upd_etiqueta({
            'etiqueta': app.etiqueta_actual,
            'campo': 'COLOR',
            'valor': p_valor
          });
        };
      }});

    };

    return this;

  };

  app._btn_nueva_seccion = function() {

    this.$dom = $('<li></li>');

    this._actualizar_dom = function() {

      var _this = this;
      
      _this.$dom.empty().removeAttr('style').removeClass().addClass('seccion-proyecto nueva-seccion-proyecto').append('<button class="btn-nueva-seccion"><span class="icon icon-plus"></span>' + app.opts.lang.agregar_seccion + '</button><input class="txt-nombre-seccion oculto" type="text" maxlength="100" />');

      app.fn.activar_timeout();

      _this.$dom.off('click', '.btn-nueva-seccion').on('click', '.btn-nueva-seccion', function(e) {
        e.preventDefault();
        var p = $(this).hide().parent();
        p.find('.txt-nombre-seccion').show().focus();
        app.fn.desactivar_timeout();
        return false;
      });

      _this.$dom.off('keyup', '.txt-nombre-seccion').on('keyup', '.txt-nombre-seccion', $.proxy(function(e) {
        if(e.keyCode === 27) {
          _this._actualizar_dom();
          app.fn.activar_timeout();
        } else if(e.keyCode === 13) {
          _this._generar_seccion();
        };
      }, _this));

      _this.$dom.off('focusout', '.txt-nombre-seccion').on('focusout', '.txt-nombre-seccion', $.proxy(function(e) {
        if(typeof _this._ajax === 'undefined') _this._generar_seccion({'salir_sin_valor': true});
      }, _this));

      return _this.$dom;

    };

    this._generar_seccion = function(p_opciones) {

      var _this = this;

      if(typeof p_opciones === 'undefined') p_opciones = {};
      if(typeof p_opciones.salir_sin_valor === 'undefined') salir_sin_valor = false;

      var v_nombre = _this.$dom.find('.txt-nombre-seccion').val();
      if(v_nombre != '' && typeof _this._ajax === 'undefined') {

        _this._ajax = true;
        app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
        _this.$dom.find('.txt-nombre-seccion').attr('disabled',true);

        app.fn.ajax(app.opts.api + app.opts.modulo + '/ins_seccion', {'nombre': v_nombre, 'proyecto': app.proyecto_actual.codigo}, function(data) {
          
          var s = app._seccion({'codigo': data.codigo, 'nombre': v_nombre, 'orden': data.orden, 'proyecto': app.proyecto_actual.codigo});
          
          app.proyecto_actual.secciones.push( s );
          
          _this._actualizar_dom();
          _this.$dom.before( s._actualizar_dom() );

          if(app.proyecto_actual.status !== 900) s.$dom.find('.sortable-panel').append( new app._btn_nueva_tarea({'seccion': s.codigo}) );

          sortable('.sortable-panel-' + app.vista_actual, 'reload');
          sortable('.sortable-panel-tareas', 'reload');

          app.fn.loader(false);

          delete _this._ajax;

        });

      } else {
        if(p_opciones.salir_sin_valor) _this._actualizar_dom();
      };

    };

    return this._actualizar_dom();
    
  };

  app._btn_nueva_tarea = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.seccion === 'undefined' && typeof p_opciones.tarea === 'undefined') return;

    this.seccion = (typeof p_opciones.seccion != 'undefined') ? p_opciones.seccion : null;
    this.tarea = (typeof p_opciones.tarea != 'undefined') ? p_opciones.tarea : null;

    this.$dom = $('<li></li>');

    this._actualizar_dom = function() {

      var _this = this;
      
      _this.$dom.empty().removeAttr('style').removeClass().addClass('elem-tarea elem-subtarea elem-nueva-tarea').append('<button class="btn-nueva-tarea"><span class="icon icon-plus"></span>' + ((_this.tarea === null) ? app.opts.lang.agregar_tarea : app.opts.lang.agregar_subtarea) + '</button><input class="txt-nombre-tarea oculto" type="text" maxlength="500" />');

      _this.$dom.off('click', '.btn-nueva-tarea').on('click', '.btn-nueva-tarea',function(e) {
        e.preventDefault();
        var p = $(this).hide().parent();
        p.find('.txt-nombre-tarea').show().focus();
        app.fn.desactivar_timeout();
        delete _this._ajax;
        return false;
      });

      _this.$dom.off('keyup', '.txt-nombre-tarea').on('keyup', '.txt-nombre-tarea', $.proxy(function(e) {
        if(e.keyCode === 27) {
          _this._actualizar_dom();
        } else if(e.keyCode === 13) {
          _this._generar_tarea();
        };
      }, _this));

      _this.$dom.off('focusout', '.txt-nombre-tarea').on('focusout', '.txt-nombre-tarea', $.proxy(function(e) {
        _this._generar_tarea({'salir_sin_valor': true});
      }, _this));

      app.fn.activar_timeout();

      return _this.$dom;

    };

    this._generar_tarea = function(p_opciones) {

      var _this = this;

      if(typeof p_opciones === 'undefined') p_opciones = {};
      if(typeof p_opciones.salir_sin_valor === 'undefined') salir_sin_valor = false;

      var v_nombre = _this.$dom.find('.txt-nombre-tarea').val();
      if(v_nombre != '' && typeof _this._ajax === 'undefined') {

        _this._ajax = true;
        app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
        _this.$dom.find('.txt-nombre-tarea').attr('disabled',true);

        var v_proyecto = '';
        if(app.proyecto_actual != null) {
          v_proyecto = app.proyecto_actual.codigo;
        } else {
          var t = app.fn.buscar_por_id(app._tareas, 'codigo', _this.tarea);
          v_proyecto = t._get_proyecto().codigo;
        };

        var v_valor_seccion = _this.seccion;
        if(app.agrupacion != '') _this.seccion = null;

        app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/ins_tarea', {'nombre': v_nombre, 'proyecto': v_proyecto, 'seccion': _this.seccion, 'tarea_padre': _this.tarea}, function(data) {
          
          delete app.peticion_actual;

          var t = {
            'codigo': data.codigo,
            'nombre': v_nombre,
            'tarea_padre': _this.tarea,
            'fecha_grabacion': moment().format(app.opts.mask.fecha),
            'usuario_grabacion': app.opts.usuario.usuario,
            'secciones': {},
            'subtareas': []
          };

          if(!app.fn.es_nulo(_this.tarea) || app.agrupacion === '' || v_valor_seccion === 'NULL') {
            
            if(_this.seccion != null) {
              t.secciones[v_proyecto] = {'seccion': _this.seccion, 'orden': data.orden};
            } else if(_this.tarea != null) {
              var p = app.fn.buscar_por_id(app._tareas, 'codigo', _this.tarea);
              p.subtareas.push({'subtarea': data.codigo, 'orden': data.orden});
              p._actualizar_dom();
              p._refrescar_progreso_subtareas();
            };
            
            var s = new app._tarea(t);

            app._tareas.push( s );
            if(_this.seccion != null) app.proyecto_actual.tareas.push({'i': (app._tareas.length - 1), 'orden': data.orden, '_campo_ordenacion': s._get_campo_ordenacion( ((app.agrupacion === '') ? data.orden : (app._tareas.length - 1)) )});

            _this._actualizar_dom();
            _this.$dom.before( s._actualizar_dom() );

            if(app.proyecto_actual != null) {
              app.proyecto_actual._controlar_limites_secciones();
              app.proyecto_actual._refrescar_contador_tareas();
            };

            if(_this.tarea != null) sortable('.sortable-panel-subtareas', 'reload');
            sortable('.sortable-panel-tareas', 'reload');

            app.fn.loader(false);

            delete _this._ajax;

          } else {
            var s = new app._tarea(t);
            app._tareas.push( s );
            app.fn.cambiar_seccion_tarea({'tarea': t, 'seccion': v_valor_seccion});
          };

        });

      } else {
        if(p_opciones.salir_sin_valor) _this._actualizar_dom();
      };

    };

    return this._actualizar_dom();
    
  };

  app.sortable = {
    secciones: null,
    tareas: null
  };

  /**
   * Funcion inicial
   * @param {Object} data Objeto con los datos del ERP
   * @memberof gtd
  */
  app.fn.inicio = function(data) {

    app.vistas_proyecto = [
      {id: 'resumen', nombre: app.opts.lang.proyecto},
      {id: 'lista', nombre: app.opts.lang.lista},
      {id: 'tablero', nombre: app.opts.lang.tablero},
      {id: 'calendario', nombre: app.opts.lang.calendario}
    ];

    if(app.parametros.contador_tareas_seccion === '') app.parametros.contador_tareas_seccion = 'N';
    if(app.parametros.ocultar_barra_lateral === '') app.parametros.ocultar_barra_lateral = 'N';
    if(app.parametros.filtro_status_tarea === '') app.parametros.filtro_status_tarea = 'P';
    if(app.parametros.vista_inicial === '') app.parametros.vista_inicial = 'lista';

    if(app.parametros.tarea != '') {
      app.parametros.ocultar_barra_lateral = 'S';
      app.parametros.filtro_status_tarea = 'T';
      app.llamada_directa = true;
    };

    app.parametros.segundos_refresco = parseInt((app.parametros.segundos_refresco || '0'));

    if(app.parametros.ocultar_barra_lateral != 'O') {
      app.fn.generar_boton_nav('nav', 'barra_lateral', 'icon-ellipsis-v', '', function() {
        app.fn.cambiar_barra_lateral();
      });
    };

    app.fn.preparar_dom();

  };

  app.fn._get_tarea = function(t) {
    if(typeof t != 'object' && typeof t != 'undefined') t = app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(t));
    return t;
  };

  app.fn._get_seccion = function(s) {
    if(typeof s != 'object' && typeof s != 'undefined') {
      s = app.fn.buscar_por_id(app.proyecto_actual.secciones, 'codigo', s.toString());
    } else {
      s = app.proyecto_actual.secciones[0];
    };
    return s;
  };

  app.fn._get_etiqueta = function(e) {
    if(typeof e != 'object' && typeof e != 'undefined') e = app.fn.buscar_por_id(app._etiquetas, 'codigo', parseInt(e));
    return e;
  };

  app.fn._get_nombre_usuario = function(p_usuario) {

    return app.permisos.usuarios['_' + p_usuario]['nombre'];

  };

  app.fn._get_num_tareas_usuario = function(p_usuario) {

    return app.permisos.usuarios['_' + p_usuario]['num_tareas_responsable'];

  };

  app.fn._get_avatar_usuario = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.usuario === 'undefined') return;
    if(typeof p_opciones.alt === 'undefined') p_opciones.alt = p_opciones.usuario;
    if(typeof p_opciones.clase === 'undefined') p_opciones.clase = '';

    var v_html = '<img class="avatar ref-usuario ' + p_opciones.clase + '" src="api/app/imagen_usuario/' + p_opciones.usuario + '.jpg" alt="' + p_opciones.alt + '" loading="lazy" />';

    return v_html;

  };

  app.fn._get_avatar_origen = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.tipo === 'undefined') return;
    if(typeof p_opciones.clase === 'undefined') p_opciones.clase = '';

    var v_color = '', v_icono = '';
    switch (p_opciones.tipo) {
      case 'P':
        v_color = 'amarillo';
        break;
      case 'E':
        v_color = 'verde';
        break;
      default:
        break;
    }

    var v_html = '<div class="avatar ref-origen ' + p_opciones.clase + ' color_libra_' + v_color + '_bg"><span class="icono">' + p_opciones.tipo + '</span></div>';

    return v_html;

  };

  app.fn._get_color_fecha = function(p_fecha) {

    var v_color = '';
    
    if(app.fn.fecha_es_hoy(p_fecha)) {
      v_color = 'orange';
    } else if(app.fn.fecha_es_manana(p_fecha)) {
      v_color = 'green';
    } else if(app.fn.fecha_es_anterior(p_fecha)) {
      v_color = 'red';
    };

    return ((v_color != '') ? 'color_libra_' + v_color : '');

  };

  app.fn._aplicar_eventos_generales = function($el) {

    $el.find('.input-calendario').paneldate(app, {'locale': app.opts.usuario.locale, 'generar_boton': false, 'usar_campo_boton': true});

    $el.find('.input-etiqueta.tarea-usuario-responsable').off('click').on('click', function(e) {

      e.preventDefault();
      var _this = $(this).addClass('visible').focus();

      $('#lista-usuarios-autocompletado').remove();
      _this.parent().parent().after( $('<ul id="lista-usuarios-autocompletado" class="lista-autocompletado"></ul>') );
      app.fn._preparar_seleccion_usuario();

    }).off('keyup').on('keyup', function(e) {

      e.preventDefault();
      var _this = $(this);
      var val = _this.val();
      if(e.keyCode != 13 && e.keyCode != 40 && e.keyCode != 38) {
        if(val.length === 0) {
          app.fn._preparar_seleccion_usuario();
        } else if(val.length > 1) {
          app.fn._preparar_seleccion_usuario({'filtro': val});
        };
      } else if(e.keyCode === 13 && val.length > 2) {
        _this.trigger('blur');
      };

    });

    $el.find('.input-etiqueta.tarea-etiqueta').off('click').on('click', function(e) {

      e.preventDefault();
      var _this = $(this).addClass('visible').focus();

      $('#lista-etiqueta-autocompletado').remove();
      _this.parent().parent().after( $('<ul id="lista-etiqueta-autocompletado" class="lista-autocompletado"></ul>') );
      app.fn._preparar_seleccion_etiqueta();

    }).off('keyup').on('keyup', function(e) {

      e.preventDefault();
      var _this = $(this);
      var val = _this.val();
      if(e.keyCode != 13 && e.keyCode != 40 && e.keyCode != 38) {
        if(val.length === 0) {
          app.fn._preparar_seleccion_etiqueta();
        } else if(val.length > 1) {
          app.fn._preparar_seleccion_etiqueta({'filtro': val});
        };
      } else if(e.keyCode === 13 && val.length > 2) {
        _this.trigger('blur');
      };

    });

    $el.find('.btn-limpiar-campo').off('click').on('click', function(e){
      e.preventDefault();
      $(this).parent().find('input').val('').trigger('blur');
    }).each(function(e) {
      var $this = $(this);
      $this.toggle( ($this.parent().find('input').val() != '') );
    });

    $el.find('.input-valor').off('click').on('click', function(e){
      e.preventDefault();
      app.fn.desactivar_timeout();
      $(this).parent().find('input').trigger('click');
    });

    $el.find('.btn-input-sin-valor').off('click').on('click', function(e){
      e.preventDefault();
      app.fn.desactivar_timeout();
      $(this).parent().find('input').trigger('click');
    });
    
    $el.find('.btn-input-ins-valor, .btn-input-usuario-responsable').off('click').on('click', function(e){
      e.preventDefault();
      app.fn.desactivar_timeout();
      if(e.target.className.indexOf('bnt-eliminar-usuario-responsable') < 0) {
        $(this).hide().parent().find('input').trigger('click');
      } else {
        app.fn.upd_tarea({
          'tarea': app.tarea_actual,
          'campo': 'USUARIO_RESPONSABLE',
          'valor': ''
        });
      };
    });

  };

  app.fn._preparar_seleccion_usuario = function(p_parametros) {

    if(typeof p_parametros === 'undefined') p_parametros = {};
    if(typeof p_parametros.tarea === 'undefined' && app.tarea_actual != null) p_parametros.tarea = app.tarea_actual;
    if(typeof p_parametros.filtro === 'undefined') p_parametros.filtro = '';
    p_parametros.filtro = p_parametros.filtro.toUpperCase();
    
    var v_html = [];

    var v_usuarios_proyecto = [];
    if(app.proyecto_actual != null) {
      v_usuarios_proyecto = app.proyecto_actual.usuarios;
    } else {
      var v_secciones = Object.keys(p_parametros.tarea.secciones);
      if(v_secciones.length === 1) {
        var p = app.fn.buscar_por_id(app._proyectos, 'codigo', parseInt(v_secciones[0]));
        v_usuarios_proyecto = p.usuarios;
      };
    };

    for(var i in v_usuarios_proyecto) {

      var u = v_usuarios_proyecto[i];
      if(typeof u.d_usuario === 'undefined') u.d_usuario = app.fn._get_nombre_usuario(u.usuario);

      var v_incluir = (p_parametros.filtro === '' || u.d_usuario.toUpperCase().indexOf(p_parametros.filtro) >= 0);
      v_incluir = (v_incluir && p_parametros.tarea.usuario_responsable != u.usuario);

      if(v_incluir) v_html.push('<li class="tarea-usuario btn-usuario-responsable-autocompletado" data-tarea="' + p_parametros.tarea.codigo + '" data-usuario="' + u.usuario + '">' + app.fn._get_avatar_usuario({'usuario': u.usuario, 'clase': 'avatar-s mr1'}) + u.d_usuario + '</li>');
      if(v_html.length > 25) break;

    };

    $('#lista-usuarios-autocompletado').empty().append( v_html.join('') ).toggle( (v_html.length > 0) );

  };

  app.fn._preparar_seleccion_etiqueta = function(p_parametros) {

    if(typeof p_parametros === 'undefined') p_parametros = {};
    if(typeof p_parametros.tarea === 'undefined' && app.tarea_actual != null) p_parametros.tarea = app.tarea_actual;
    if(typeof p_parametros.filtro === 'undefined') p_parametros.filtro = '';
    p_parametros.filtro = p_parametros.filtro.toUpperCase();
    
    var v_html = [];

    for(var e in app._etiquetas) {

      var t = app._etiquetas[e];
      var v_incluir = (p_parametros.filtro === '' || t.nombre.toUpperCase().indexOf(p_parametros.filtro) >= 0);
      if(v_incluir && typeof p_parametros.tarea != 'undefined') {
        v_incluir = (p_parametros.tarea.etiquetas.indexOf(t.codigo) < 0);
      };
      if(v_incluir) v_html.push('<li class="tarea-etiqueta btn-etiqueta-autocompletado' + ((t.color != '') ? ' color_libra_' + t.color + '_bg' : '') + '" data-tarea="' + p_parametros.tarea.codigo + '" data-etiqueta="' + t.codigo + '">' + t.nombre + '</li>');
      if(v_html.length > 25) break;

    };

    $('#lista-etiqueta-autocompletado').empty().append( v_html.join('') ).toggle( (v_html.length > 0) );

  };

  app.fn._actualizar_dependencias_tareas = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.tarea_principal === 'undefined') return;
    if(typeof p_opciones.borrar_dependencia === 'undefined') p_opciones.borrar_dependencia = false;

    // recorremos las tareas para ver si alguna dependía de esta
    for(var i in app._tareas) {
      if(app._tareas[i].depende_de_tarea === p_opciones.tarea_principal) {
        if(p_opciones.borrar_dependencia) app._tareas[i].depende_de_tarea = '';
        app._tareas[i]._actualizar_dom();
        if(app.tarea_actual != null && app.tarea_actual.codigo === app._tareas[i].codigo) app.fn.preparar_dom_detalle_tarea();
      };
    };

  };

  app.fn._puede_ordenar_tareas = function() {

    return (/*app.agrupacion === '' && */app.ordenacion.campo === '');

  };

  app.fn._hay_proyectos_publicos = function() {
    var el = app.fn.buscar_index_por_id(app._proyectos, 'tipo', 'P');
    return (el > (-1));
  };

  app.fn._hay_gestion_expedientes = function() {
    var el = app.fn.buscar_index_por_id(app._proyectos, 'gestiona_expedientes', 'S');
    return (el > (-1));
  };

  app.fn.limpiar_filtros = function() {

    app.filtros = {
      filtro_texto: '',
      filtro_usuario_responsable: ''
    };

    app.tpl.gtd.sidebar.find('.sidebar-buscador').find('input').val('');

    app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.btn-limpiar-buscador').hide();
    app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.filtro-activo').removeClass('filtro-activo');

    delete app._hash_peticion_actual;

  };

  /**
   * Preparar DOM
   * @memberof gtd
   */
  app.fn.preparar_dom = function() {

    app.fn.activar_region(app.tpl.region.r_gtd, {vaciar: true, clases: 'flexbox', footer: false, modal: false, callback: function() {

      if(app.parametros.ocultar_barra_lateral != 'O') app.tpl.nav.barra_lateral.show();

      app.tpl.gtd = {
        sidebar: $('<section id="gtd-sidebar"></div>'),
        panel: $('<section id="gtd-panel"></div>'),
        menu: $('<section id="gtd-panel-menu"></div>'),
        menu_wrapper: $('<section class="gtd-panel-wrapper"></div>'),
        menu_logo: $('<section id="gtd-panel-menu-logo"><button class="btn-logo"></button></div>'),
        menu_info: $('<section id="gtd-panel-menu-info"></div>'),
        menu_header: $('<section class="gtd-panel-menu-header"></div>'),
        menu_tabs: $('<section class="gtd-panel-menu-tabs"></div>'),
        filtros: $('<section id="gtd-panel-filtros"></div>'),
        proyecto: $('<section id="gtd-panel-proyecto"></div>'),
        wrapper_resumen: $('<div class="gtd-panel-wrapper gtd-panel-wrapper-resumen oculto"></div>'),
        resumen: $('<div class="gtd-panel-resumen"></div>'),
        wrapper_lista: $('<div class="gtd-panel-wrapper gtd-panel-wrapper-lista oculto"></div>'),
        lista: $('<ul class="sortable-panel sortable-panel-lista"></ul>'),
        wrapper_tablero: $('<div class="gtd-panel-wrapper gtd-panel-wrapper-tablero oculto"></div>'),
        tablero: $('<ul class="sortable-panel sortable-panel-tablero"></ul>'),
        wrapper_calendario: $('<div class="gtd-panel-wrapper gtd-panel-wrapper-calendario oculto"></div>'),
        calendario: $('<div class="gtd-panel-calendario"></div>'),
        wrapper_archivos: $('<div class="gtd-panel-wrapper gtd-panel-wrapper-archivos oculto"></div>'),
        archivos: $('<div class="gtd-panel-archivos"></div>'),
        detalle_tarea: $('<div class="region panel-lateral gtd-panel-detalle-tarea"></div>')
      };

      var v_html = [];
      for(var i in app.vistas_proyecto) {
        var v = app.vistas_proyecto[i];
        v_html.push('<button id="vista-' + v.id + '">' + v.nombre + '</buton>');
      };
      
      app.tpl.gtd.menu_tabs.append( v_html.join('') ).on('click', 'button', function() {
        
        app.fn.cambiar_vista_proyecto( {'vista': $(this).attr('id').replace('vista-', '')} );

        app.fn.enviar_beacon(app.opts.api + app.opts.modulo + '/set_opcion_usuario', {'opcion': 'ULTIMA_VISTA', 'valor': app.vista_actual});

      });
      
      app.tpl.gtd.menu_info.append( app.tpl.gtd.menu_header, app.tpl.gtd.menu_tabs );
      app.tpl.gtd.menu_wrapper.append( app.tpl.gtd.menu_logo, app.tpl.gtd.menu_info );
      
      app.tpl.gtd.menu.append( app.tpl.gtd.menu_wrapper );

      app.tpl.gtd.ordenacion_tareas = $('<button class="btn-hover btn-filtro btn-ordenacion-tareas"><span class="icon icon-sort-alt mr1"></span><span class="lbl">' + app.opts.lang.ordenacion + '</span></button>').appendTo( app.tpl.gtd.filtros );

      app.tpl.gtd.agrupacion_vista = $('<button class="btn-hover btn-filtro btn-agrupacion-vista"><span class="icon icon-layer-group mr1"></span><span class="lbl">' + app.opts.lang.seccion + '</span></button>').appendTo( app.tpl.gtd.filtros );

      app.tpl.gtd.filtro_status_tarea = $('<button class="btn-hover btn-filtro btn-filtro-status"><span class="icon icon-check-circle mr1"></span><span class="lbl">' + app.opts.lang.tareas_sin_finalizar + '</span></button>').appendTo( app.tpl.gtd.filtros );

      app.tpl.gtd.wrapper_resumen.append( app.tpl.gtd.resumen );

      app.tpl.gtd.wrapper_calendario.append( app.tpl.gtd.calendario );

      app.tpl.gtd.wrapper_lista.append( app.tpl.gtd.lista ).on('click', function(e){
        if(e.target !== e.currentTarget) return;
        if(app.tarea_actual != null) app.fn.ocultar_detalle_tarea();
      });
      app.tpl.gtd.wrapper_tablero.append( app.tpl.gtd.tablero ).on('click', function(e){
        if(e.target !== e.currentTarget && e.target.className != 'seccion-proyecto-header' && e.target.className != 'seccion-proyecto' && e.target.className.indexOf('sortable-panel-tareas') < 0) return;
        if(app.tarea_actual != null) app.fn.ocultar_detalle_tarea();
      });
      app.tpl.gtd.wrapper_archivos.append( app.tpl.gtd.archivos );

      app.tpl.gtd.proyecto.append(app.tpl.gtd.filtros, app.tpl.gtd.wrapper_resumen, app.tpl.gtd.wrapper_lista, app.tpl.gtd.wrapper_tablero, app.tpl.gtd.wrapper_calendario, app.tpl.gtd.wrapper_archivos, app.tpl.gtd.detalle_tarea );

      app.tpl.gtd.panel.append( app.tpl.gtd.menu, app.tpl.gtd.proyecto );

      var v_html = [];

      v_html.push('<nav class="sidebar-menu"><div class="sidebar-proyectos-wrapper"><ul class="sidebar-lista"><li class="sidebar-lista-item"><button class="sidebar-menu-mis-tareas"><div class="icono"><span class="icon icon-check-circle"></span></div><span id="lbl-menu-mis-tareas">' + app.opts.lang.tareas_personales + '</span></button></li><li class="sidebar-lista-item"><button class="sidebar-menu-asignadas"><div class="icono"><span class="icon icon-user"></span></div><span id="lbl-menu-asignadas">' + app.opts.lang.tareas_asignadas + '</span></button></li></ul></div></nav>');

      v_html.push('<hr />');

      v_html.push('<nav class="sidebar-buscador"><div class="sidebar-buscador-wrapper"><header class="sidebar-header"><h4 class="sidebar-titulo">' + app.opts.lang.buscador + '</h4><div class="sidebar-acciones"><button class="btn-limpiar-buscador oculto"><span class="icon icon-times"></span></button><button class="btn-buscador-avanzado"><span class="icon icon-ellipsis-v"></span></button></div></header><div class="gtd-wrapper-buscador"><div class="gtd-buscador-texto"><input type="text" value="" /><span class="icon icon-search"></span></div><div class="gtd-buscador-avanzado gtd-buscador-fecha oculto"></div><div class="gtd-buscador-avanzado gtd-buscador-usuario-responsable oculto"></div></div></div></nav>');

      v_html.push('<hr />');

      v_html.push('<nav class="sidebar-proyectos"><div class="sidebar-proyectos-wrapper"><header class="sidebar-header"><h4 class="sidebar-titulo">' + app.opts.lang.proyectos + '</h4><button class="btn-nuevo-proyecto"><span class="icon icon-plus"></span></button></header><ul class="sidebar-lista"></ul></div></nav>');

      v_html.push('<hr />');
      
      v_html.push('<nav class="sidebar-etiquetas"><div class="sidebar-etiquetas-wrapper"><header class="sidebar-header"><h4 class="sidebar-titulo">' + app.opts.lang.etiquetas + '</h4></header><ul class="sidebar-lista"></ul></div></nav>');
      
      app.tpl.gtd.sidebar.append( v_html.join('') ).toggleClass('colapsada', (app.viewport.width < 600) );
      if(app.parametros.ocultar_barra_lateral === 'S') app.tpl.gtd.sidebar.addClass('colapsada');

      app.tpl.region.r_gtd.append( app.tpl.gtd.sidebar, app.tpl.gtd.panel );

      app.fn.limpiar_dom_panel();
      
      app.tpl.gtd.sidebar.on('click', '.sidebar-menu-mis-tareas', function(e) {
        var el = app.fn.buscar_por_id(app._proyectos, 'tipo', 'U');
        app.fn.cambiar_proyecto(el);
      });

      app.tpl.gtd.sidebar.on('click', '.sidebar-menu-asignadas', function(e) {
        app.fn.limpiar_filtros();
        app.fn.cambiar_filtros({'filtro_usuario_responsable': app.opts.usuario.usuario});
      });

      app.tpl.gtd.sidebar.on('click', '.sidebar-etiquetas .sidebar-lista-item button', function(e) {
        var v_codigo = $(this).data('etiqueta');
        var el = app.fn.buscar_por_id(app._etiquetas, 'codigo', parseInt(v_codigo));
        app.fn.cambiar_etiqueta(el);
      });
      
      app.tpl.gtd.sidebar.on('click', '.btn-nuevo-proyecto', function(e) {
        app.fn.mostrar_alta_proyecto();
      });

      app.tpl.gtd.sidebar.on('click', '.sidebar-proyectos .sidebar-lista-item button', function(e) {
        var v_codigo = $(this).data('proyecto');
        var el = app.fn.buscar_por_id(app._proyectos, 'codigo', parseInt(v_codigo));
        app.fn.cambiar_proyecto(el);
      });
      
      app.tpl.gtd.proyecto.on('click', '.sortable-panel .elem-tarea', function(e) {

        var v_target = (['BUTTON','INPUT','TEXTAREA'].indexOf(e.target.nodeName) < 0 || e.target.className.indexOf('btn-prop') >= 0);

        if(v_target) {
 
          var t = $(this).data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
            e.preventDefault();
            app.tpl.gtd.proyecto.find('.elem-tarea').removeClass('tarea-seleccionada');
            $(this).addClass('tarea-seleccionada');
            app.fn.mostrar_detalle_tarea({'tarea': t});
            if(app.vista_actual === 'tablero') setTimeout(function(){ 
              var tl = app.tpl.gtd.wrapper_tablero.find('.tarea-seleccionada');
              if(tl.length === 1) {
                var wl = app.tpl.gtd.wrapper_tablero.offset().left;
                var ws = app.tpl.gtd.wrapper_tablero.scrollLeft();
                app.tpl.gtd.wrapper_tablero.animate({scrollLeft: (tl.offset().left - wl + ws - 15)}, 500 );
              };
            }, 500);
            return false;
          };

        };
        
      });

      app.tpl.gtd.proyecto.on('click', '.btn-usuario-responsable-autocompletado', function(evt) {
 
        var t = $(this).data('tarea');

        if(!app.fn.es_nulo(t)) {
          t = app.fn._get_tarea(t);
          var e = $(this).data('usuario');
          if(typeof e != 'undefined') {
            evt.preventDefault();
            $('.input-etiqueta.tarea-usuario-responsable').val('');
            t = app.fn.buscar_por_id(app._tareas, 'codigo', t);
            app.fn.upd_tarea({
              'tarea': app.tarea_actual,
              'campo': 'USUARIO_RESPONSABLE',
              'valor': e
            });
            return false;
          };
        };
        
      });

      app.tpl.gtd.proyecto.on('click', '.btn-etiqueta-autocompletado', function(evt) {
 
        var t = $(this).data('tarea');
        if(!app.fn.es_nulo(t)) {
          t = app.fn._get_tarea(t);
          var e = $(this).data('etiqueta');
          if(typeof e != 'undefined') {
            evt.preventDefault();
            $('.input-etiqueta.tarea-etiqueta').val('');
            app.fn.ins_tarea_etiqueta({
              'tarea': t,
              'etiqueta': e
            });
            return false;
          };
        };
        
      });

      app.tpl.gtd.sidebar.find('.sidebar-buscador').find('input').off().on('change', function(){
        var v_val = $(this).val();
        if(!app.fn.es_nulo(app.filtros.filtro_usuario_responsable) && app.filtros.filtro_usuario_responsable === app.opts.usuario.usuario) app.filtros.filtro_usuario_responsable = '';
        app.fn.cambiar_filtros({'filtro_texto': v_val});
      });

      app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.btn-buscador-avanzado').off().on('click', function(){
        app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.gtd-buscador-avanzado').toggle();
      });

      app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.btn-limpiar-buscador').off().on('click', function(){
        app.fn._restablecer_parametros_vista();
        app.tpl.gtd.agrupacion_vista.hide();
        app.fn.cargar_gtd();
      });

      // filtro por fechas
      v_html = ['<header><span class="icon icon-clock mr1 ml1"></span>' + app.opts.lang.fecha_entrega + '</header>'];
      v_html.push('<ul class="sidebar-lista">');

      var v_filtros = [];
      for(var i in app.opts.lang) {
        if(i.indexOf('filtro_fecha_') === 0) v_filtros.push(i.replace('filtro_fecha_', ''));
      };
      v_filtros.sort();
      for(var i in v_filtros) {
        var v_cod = v_filtros[i].substring(3).toUpperCase();
        v_html.push('<li class="sidebar-lista-item"><button data-valor="' + v_cod + '">' + app.opts.lang['filtro_fecha_' + v_filtros[i]] + '</button></li>');
      };

      v_html.push('</ul>');

      app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.gtd-buscador-fecha').append(v_html.join('')).off().on('click', '.sidebar-lista-item > button', function(){
        app.fn._pulsar_filtro_buscador_avanzado({'elem': $(this), 'filtro': 'filtro_fecha'});
      });

      // filtro por usuario responsable

      app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.gtd-buscador-usuario-responsable').append('<header><span class="icon icon-user mr1 ml1"></span>' + app.opts.lang.usuario_responsable + '</header><ul class="sidebar-lista"></ul>').off().on('click', '.sidebar-lista-item > button', function(){
        app.fn._pulsar_filtro_buscador_avanzado({'elem': $(this), 'filtro': 'filtro_usuario_responsable'});
      });


      // MENU CONTEXTUAL LOGO PROYECTO
      $.contextMenu({
        selector: '#gtd-panel-menu-logo > .btn-logo',
        className: 'btn-logo',
        trigger: 'left',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();
  
          var v_items = {};

          if(app.proyecto_actual != null) {

            v_items.cambiar_icono = {
              name: '<span class="mr1 icon icon-camera"></span>' + app.erp.alta_proyecto.p_icono.etiqueta,
              isHtmlName: true
            };

          } else {

            v_items.cambiar_nombre = {
              name: '<span class="mr1 icon icon-text"></span>' + app.erp.etiqueta.p_nombre.etiqueta,
              isHtmlName: true
            };
          };

          v_items.cambiar_color = {
            name: '<span class="mr1 icon icon-palette"></span>' + app.erp.alta_proyecto.p_color.etiqueta,
            isHtmlName: true
          };
  
          return {
            callback: function (key, options) {
              var $el = $(this);
              if(key === 'cambiar_icono') app.proyecto_actual._cambiar_icono();
              if(key === 'cambiar_nombre') app.fn.mostrar_gestion_campo({'bloque': 'etiqueta', 'objeto': app.etiqueta_actual, '$el': $el, 'campo': 'nombre'});
              if(key === 'cambiar_color') {
                if(app.proyecto_actual != null) app.proyecto_actual._cambiar_color();
                if(app.etiqueta_actual != null) app.etiqueta_actual._cambiar_color();
              }
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL ORDENACION DE TAREAS
      $.contextMenu({
        selector: '.btn-ordenacion-tareas',
        className: 'btn-filtro',
        trigger: 'left',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();
  
          var v_items = {};

          if(app.agrupacion != 'fecha_entrega') {
            v_items.fecha_entrega = {
              name: ((app.ordenacion.campo === 'fecha_entrega') ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl" data-tipo="DATE">' + app.opts.lang.fecha_entrega + '</span>',
              isHtmlName: true
            };
          };

          if(((app.proyecto_actual !== null && app.proyecto_actual.tipo != 'U') || (app.proyecto_actual === null && app.fn._hay_proyectos_publicos())) && app.agrupacion != 'usuario_responsable') {
            v_items.usuario_responsable = {
              name: ((app.ordenacion.campo === 'usuario_responsable') ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl" data-tipo="VARCHAR2">' + app.opts.lang.usuario_responsable + '</span>',
              isHtmlName: true
            };
          };

          if(((app.proyecto_actual !== null && app.proyecto_actual.gestiona_expedientes === 'S') || (app.proyecto_actual === null && app.fn._hay_gestion_expedientes())) && app.agrupacion != 'crm_expediente_linea') {
            v_items.crm_expediente_linea = {
              name: ((app.ordenacion.campo === 'crm_expediente_linea') ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl" data-tipo="NUMBER">' + app.opts.lang.crm_numero_expediente + '</span>',
              isHtmlName: true
            };
          };

          if(app.proyecto_actual != null && typeof app.proyecto_actual.campos_aux != 'undefined') {
            for(var c in app.proyecto_actual.campos_aux) {
        
              var v_campo = app.proyecto_actual.campos_aux[c];
              var v_tipo_ordenacion = (v_campo.tipo === 'N' || v_campo.tipo === 'S') ? 'NUMBER' : 'VARCHAR2';

              if(app.agrupacion != v_campo.campo) {
                v_items[v_campo.campo] = {
                  name: ((app.ordenacion.campo === v_campo.campo) ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl" data-tipo="' + v_tipo_ordenacion + '">' + v_campo.nombre + '</span>',
                  isHtmlName: true
                };
              };
      
            };
          };

          if(app.ordenacion.campo !== '') {

            v_items['sep'] = "-----";

            v_items.ordenar_por_seccion = {
              name: app.opts.lang.ordenar_por_seccion,
              type: 'checkbox', 
              selected: ((app.ordenacion.ordenar_por_seccion === 'S') ? true : false),
              events: { click: function(e) {
  
                var $input = $(this);
                v_modo = (($input.is(':checked')) ? 'S' : 'N');
  
                app.fn.cambiar_ordenacion_tareas({'ordenar_por_seccion': v_modo});
  
              }}
            };
            
            v_items.cancelar = {
              name: '<span class="mr1 icon icon-close"></span><span class="lbl">' + app.opts.lang.cancelar + '</span>',
              isHtmlName: true,
              className: 'color_libra_rojo'
            };

          };
  
          return {
            callback: function (key, options) {
              app.fn.cambiar_ordenacion_tareas({'modo': ((key !== 'cancelar') ? key : ''), '$elem': options.$selected});
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL AGRUPACION VISTA
      $.contextMenu({
        selector: '.btn-agrupacion-vista',
        className: 'btn-filtro',
        trigger: 'left',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();
  
          var v_items = {};

          v_items.seccion = {
            name: ((app.agrupacion === '') ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl">' + app.opts.lang.seccion + '</span>',
            isHtmlName: true
          };

          v_items.fecha_entrega = {
            name: ((app.agrupacion === 'fecha_entrega') ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl">' + app.opts.lang.fecha_entrega + '</span>',
            isHtmlName: true
          };

          if(app.proyecto_actual.tipo != 'U') {
            v_items.usuario_responsable = {
              name: ((app.agrupacion === 'usuario_responsable') ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl">' + app.opts.lang.usuario_responsable + '</span>',
              isHtmlName: true
            };
          };

          if(app.proyecto_actual.gestiona_expedientes === 'S') {
            v_items.crm_expediente_linea = {
              name: ((app.agrupacion === 'crm_expediente_linea') ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl">' + app.opts.lang.crm_numero_expediente + '</span>',
              isHtmlName: true
            };
          };

          if(app.proyecto_actual != null && typeof app.proyecto_actual.campos_aux != 'undefined') {
            for(var c in app.proyecto_actual.campos_aux) {
        
              var v_campo = app.proyecto_actual.campos_aux[c];
              v_items[v_campo.campo] = {
                name: ((app.agrupacion === v_campo.campo) ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl">' + v_campo.nombre + '</span>',
                isHtmlName: true
              };
      
            };
          };

          v_items['sep'] = "-----";
          v_items.contador_tareas_seccion = {
            name: app.opts.lang.contador_tareas_seccion,
            type: 'checkbox', 
            selected: ((app.parametros.contador_tareas_seccion === 'S') ? true : false),
            events: { click: function(e) {

              var $input = $(this);
              v_modo = (($input.is(':checked')) ? 'S' : 'N');

              app.fn.cambiar_contador_tareas_seccion(v_modo);

            }}
          };
  
          return {
            callback: function (key, options) {
              if(key !== 'contador_tareas_seccion') {
                app.fn.cambiar_agrupacion_vista({'modo': key, '$elem': options.$selected});
              };
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL FILTROS
      $.contextMenu({
        selector: '.btn-filtro-status',
        className: 'btn-filtro',
        trigger: 'left',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();
  
          var v_items = {};

          v_items.tareas_sin_finalizar = {
            name: ((app.parametros.filtro_status_tarea === 'P') ? '<span class="mr1 icon icon-check"></span>' : '') + app.opts.lang.tareas_sin_finalizar,
            isHtmlName: true
          };

          v_items.tareas_finalizadas = {
            name: ((app.parametros.filtro_status_tarea === 'F') ? '<span class="mr1 icon icon-check"></span>' : '') + app.opts.lang.tareas_finalizadas,
            isHtmlName: true
          };

          v_items.todas_las_tareas = {
            name: ((app.parametros.filtro_status_tarea === 'T') ? '<span class="mr1 icon icon-check"></span>' : '') + app.opts.lang.todas_las_tareas,
            isHtmlName: true
          };
  
          return {
            callback: function (key, options) {
              var $el = $(this);
              if(key === 'tareas_sin_finalizar') app.fn.cambiar_filtro_status_tarea('P');
              if(key === 'tareas_finalizadas') app.fn.cambiar_filtro_status_tarea('F');
              if(key === 'todas_las_tareas') app.fn.cambiar_filtro_status_tarea('T');
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL SECCIONES

      $.contextMenu({
        selector: '.btn-menu-seccion',
        className: 'menu-seccion',
        trigger: 'left',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();

          var s = $trigger.closest('.seccion-proyecto').data('seccion');
          if(app.fn.es_nulo(s)) return false;

          s = app.fn._get_seccion(s);
  
          var v_items = {};

          if(s.modificable) { 

            v_items.color_seccion = {
              name: '<span class="mr1 icon icon-palette"></span>' + app.erp.seccion.p_color.etiqueta,
              isHtmlName: true
            };

            var v_subnivel = {};

            v_subnivel.minimo_seccion = {
              name: '<span class="mr1 icon icon-arrow-alt-from-top"></span>' + app.erp.seccion.p_minimo_tareas.etiqueta,
              isHtmlName: true
            };
            v_subnivel.maximo_seccion = {
              name: '<span class="mr1 icon icon-arrow-alt-to-top"></span>' + app.erp.seccion.p_maximo_tareas.etiqueta,
              isHtmlName: true
            };

            v_items['limites_seccion'] = {
              name: '<span class="mr1 icon icon-exclamation-triangle"></span>' + app.opts.lang.establecer_limites,
              isHtmlName: true,
              items: v_subnivel
            };

            v_items['observaciones'] = {
              name: '<span class="mr1 icon icon-info-circle"></span>' + app.opts.lang.observaciones,
              isHtmlName: true
            };

            if(parseInt(s.codigo) != 0) {
              
              v_items['sep'] = "-----";
              v_items.eliminar_seccion = {
                name: '<span class="mr1 icon icon-trash"></span>' + app.opts.lang.eliminar,
                isHtmlName: true,
                className: 'color_libra_rojo'
              };

            };

          };

          if(app.vista_actual === 'tablero') {

            if(v_items.length > 0) v_items['sep-' + v_items.length ] = "-----";

            var v_subnivel = {};

            for(var i = 1; i < 5; i++) {
              v_subnivel['columnas_seccion_' +  i] = {
                name:  ((s.columnas_tablero === i) ? '<span class="mr1 icon icon-check"></span>' : '') + '<span class="lbl">' + i +'</span>',
                isHtmlName: true
              };
            };

            v_items['columnas_seccion'] = {
              name: '<span class="mr1 icon icon-grip-vertical"></span>' + app.opts.lang.columnas,
              isHtmlName: true,
              items: v_subnivel
            };

          };
          
          if(app.fn.esta_vacio(v_items)) return false;
  
          return {
            callback: function (key, options) {
              var $el = $(this);
              var s = $el.closest('.seccion-proyecto').data('seccion');
              if(!app.fn.es_nulo(s)) {
                s = app.fn._get_seccion(s);
                
                if(key === 'color_seccion') app.fn.mostrar_gestion_campo({'bloque': 'seccion', 'objeto': s, '$el': $el, 'campo': 'color'});
                if(key === 'minimo_seccion') app.fn.mostrar_gestion_campo({'bloque': 'seccion', 'objeto': s, '$el': $el, 'campo': 'minimo_tareas'});
                if(key === 'maximo_seccion') app.fn.mostrar_gestion_campo({'bloque': 'seccion', 'objeto': s, '$el': $el, 'campo': 'maximo_tareas'});
                if(key === 'observaciones') app.fn.mostrar_gestion_campo({'bloque': 'seccion', 'objeto': s, '$el': $el, 'campo': 'observaciones'});
                if(key === 'editar_seccion') app.fn.mostrar_gestion_campo({'bloque': 'seccion', 'objeto': s, '$el': $el});
                if(key === 'eliminar_seccion') app.fn.confirmar_del_seccion({'seccion': s, '$el': $el});
                if(key.indexOf('columnas_seccion') >= 0) {
                  var v_num = key.replace('columnas_seccion_', '');
                  s._asignar_columnas(v_num);
                };
              
              };
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL TAREAS

      $.contextMenu({
        selector: '.menu-contextual-tarea:not(.elem-nueva-tarea)',
        className: 'menu-contextual-tarea',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();
  
          var t = $trigger.data('tarea');
          if(!app.fn.es_nulo(t)) t = app.fn._get_tarea(t);

          var v_items = app.fn._preparar_menu_contextual_tarea({
            'tarea': t,
            'mas_acciones': $trigger.hasClass('btn-acciones-tarea')
          });

          return {
            callback: function (key, options) {
              var $el = $(this);
              app.fn._callback_menu_contextual_tarea($el, key, options);
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL CAMPOS AUXILIARES

      $.contextMenu({
        selector: '.menu-contextual-campo-aux',
        className: 'menu-contextual-campo-aux',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();

          var v_id = $trigger.data('campo-aux');
          var v_tarea = ($trigger.data('tarea') || '');
          if(app.fn.es_nulo(v_tarea)) v_tarea = app.tarea_actual;
          var v_proyecto_tarea = (app.proyecto_actual != null) ? app.proyecto_actual : v_tarea._get_proyecto();

          var v_items = {};

          var aux = app.fn.buscar_por_id(v_proyecto_tarea.campos_aux, 'campo', v_id);

          if(aux.valores.length > 0) v_items['val-NULL'] = {
            name: '-'
          };

          for(var i in aux.valores) {
            v_items['val-' + aux.valores[i].codigo] = {
              name: aux.valores[i].valor,
              isHtmlName: true,
              dataAttr: {
                tarea: v_tarea
              },
              className: ((typeof aux.valores[i].color != 'undefined' && aux.valores[i].color != '') ? 'color_libra_' + aux.valores[i].color.toLowerCase() + '_bg' : '')
            };
          };

          return {
            callback: function (key, options) {
              var $el = $(this);
              app.fn._callback_menu_contextual_campo_aux($el, key);
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL PERMISOS

      $.contextMenu({
        selector: '.elem-permiso:not(.dependiente)',
        className: 'elem-permiso',
        trigger: 'left',
        events: {
          show : function(options){
            app.fn.desactivar_timeout();
          },
          hide : function(options){
            if(typeof options.$selected === 'undefined' || options.$selected === null) app.fn.activar_timeout();
          }
        },
        build: function ($trigger, e) {
          e.preventDefault();

          var v_items = {};

          if(app.proyecto_actual.es_modificable()) {

            v_items['cambiar_supervisor'] = {
              name: '<span class="mr1 icon icon-crown"></span>' + app.opts.lang.cambiar_supervisor,
              isHtmlName: true
            };
            
            v_items['sep'] = "-----";
            v_items['eliminar_permiso'] = {
              name: '<span class="mr1 icon icon-trash"></span>' + app.opts.lang.eliminar,
              isHtmlName: true,
              className: 'color_libra_rojo'
            };

          };

          return {
            callback: function (key, options) {
              var $el = $(this);
              var v_origen = $el.data('origen');
              var v_codigo = '';
              switch (v_origen) {
                case 'E':
                  v_codigo = $el.data('equipo');
                  break;
                case 'P':
                  v_codigo = $el.data('perfil');
                  break;
                default:
                  v_codigo = $el.data('usuario');
                  break;
              };
              if(key === 'cambiar_supervisor') app.fn.upd_proyecto_permiso({'tipo_autorizacion': v_origen, 'codigo': v_codigo, 'accion': 'SUPERVISOR'});
              if(key === 'eliminar_permiso') app.fn.del_proyecto_permiso({'tipo_autorizacion': v_origen, 'codigo': v_codigo});
            },
            items: v_items
          };
        }
      });

      // MENU CONTEXTUAL EXPEDIENTE
      $.contextMenu({
        selector: '.gtd-panel-detalle-tarea .tarea-expediente',
        trigger: 'left', 
        callback: function(key, options) {
          var t = $(this).closest('.data-tarea').data('tarea');
          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);
            app.fn.navegar_expediente_bpm({'numero_expediente': t.crm_numero_expediente, 'm': key});
          };
        },
        items: {
          "crmmebpm": {name: app.opts.lang.crm_crmmebpm},
          "crmexpedientes_cab": {name: app.opts.lang.crm_crmexpedientes_cab}
        }
      });

      app.fn.cargar_gtd();

    }});

  };

  app.fn._preparar_menu_contextual_tarea = function(p_opciones) {

    if(typeof p_opciones === 'undefined') return;
    if(typeof p_opciones.tarea === 'undefined') return;
    if(typeof p_opciones.mas_acciones === 'undefined') p_opciones.mas_acciones = false;

    var v_items = {};

    if(!p_opciones.mas_acciones) {
  
      if(p_opciones.tarea.status != 'F') {
        v_items.finalizar_tarea = {
          name: '<span class="mr1 icon icon-check-circle"></span>' + app.opts.lang.finalizar,
          isHtmlName: true,
          className: 'color_libra_verde'
        };
      } else {
        v_items.marcar_pendiente = {
          name: '<span class="mr1 icon icon-circle"></span>' + app.opts.lang.marcar_pendiente,
          isHtmlName: true
        };
      };

      v_items.mostrar_detalle_tarea = {
        name: '<span class="mr1 icon icon-poll-h"></span>' + app.opts.lang.mostrar_detalle_tarea,
        isHtmlName: true
      };

    };

    if(p_opciones.mas_acciones && app.fn.es_nulo(p_opciones.tarea.fecha_inicio) && app.tpl.gtd.detalle_tarea.find('.con-fecha-inicio').length === 0) {

      v_items['asignar_fecha_inicio'] = {
        name: '<span class="mr1 icon icon-calendar"></span>' + app.opts.lang.asignar_fecha_inicio,
        isHtmlName: true
      };

    };

    if(p_opciones.tarea.tarea_padre === '') {

      if(p_opciones.tarea.depende_de_tarea === '') {

        if(app.proyecto_actual != null && typeof app.proyecto_actual.tareas != 'undefined' && app.proyecto_actual.tareas.length > 1) {

          v_items.asignar_dependencia = {
            name: '<span class="mr1 icon icon-link"></span>' + app.opts.lang.asignar_dependencia,
            isHtmlName: true
          };
          
        };

      } else {

        v_items.eliminar_dependencia = {
          name: '<span class="mr1 icon icon-unlink"></span>' + app.opts.lang.eliminar_dependencia,
          isHtmlName: true
        };

      };
      
    };

    if(app.proyecto_actual != null) {

      if(app.proyecto_actual.gestiona_expedientes === 'S' && p_opciones.tarea.tarea_padre === '') {

        if(p_opciones.tarea.crm_numero_expediente === '') {
          v_items.asignar_expediente = {
            name: '<span class="mr1 icon icon-network-wired"></span>' + app.opts.lang.asignar_expediente,
            isHtmlName: true
          };
        } else {
          v_items.desvincular_expediente = {
            name: '<span class="mr1 icon icon-network-wired"></span>' + app.opts.lang.desvincular_expediente,
            isHtmlName: true
          };
        };

      };

      var v_subnivel = {};

      for(var i in app.proyecto_actual.secciones) {
        var s = app.proyecto_actual.secciones[i];
        if(typeof p_opciones.tarea.secciones[app.proyecto_actual.codigo] === 'undefined' || p_opciones.tarea.secciones[app.proyecto_actual.codigo].seccion != s.codigo) {
          v_subnivel['mover-a-seccion-' + s.codigo] = {
            name: s.nombre
          };
        };
      };

      if(!app.fn.esta_vacio(v_subnivel) && app.fn._puede_ordenar_tareas()) {

        if(!app.fn.esta_vacio(v_items)) v_items['sep-secciones'] = "-----";

        v_items['mover_a_seccion'] = {
          name: '<span class="mr1 icon icon-exchange"></span>' + app.opts.lang.mover_a_seccion,
          isHtmlName: true,
          items: v_subnivel
        };
        
      };

    };

    if(!app.fn.esta_vacio(v_items)) v_items['sep-eliminar'] = "-----";

    v_items.eliminar_tarea = {
      name: '<span class="mr1 icon icon-trash"></span>' + app.opts.lang.eliminar,
      isHtmlName: true,
      className: 'color_libra_rojo'
    };

    return v_items;
    
  };

  app.fn._callback_menu_contextual_tarea = function($el, key, options) {

    var v_tarea = $el.data('tarea');
    if(!app.fn.es_nulo(v_tarea)) {

      v_tarea = app.fn._get_tarea(v_tarea);

      if(key === 'finalizar_tarea') app.fn.cambiar_status_tarea({'tarea': v_tarea, 'modo': 'F'});
      if(key === 'marcar_pendiente') app.fn.cambiar_status_tarea({'tarea': v_tarea, 'modo': 'P'});
      if(key === 'mostrar_detalle_tarea') app.fn.mostrar_detalle_tarea({'tarea': v_tarea});
      if(key === 'asignar_fecha_inicio') app.tpl.gtd.detalle_tarea.find('.tarea-fecha-inicio').closest('.field').addClass('con-fecha-inicio').find('.btn-input-sin-valor').trigger('click');
      if(key === 'asignar_dependencia') app.fn.asignar_dependencia({'tarea': v_tarea, '$el': $el});
      if(key === 'eliminar_dependencia') app.fn.eliminar_dependencia({'tarea': v_tarea, '$el': $el});
      if(key === 'asignar_expediente') app.fn.asignar_expediente({'tarea': v_tarea, '$el': $el});
      if(key === 'desvincular_expediente') app.fn.desvincular_expediente({'tarea': v_tarea, '$el': $el});
      if(key.indexOf('mover-a-seccion-') === 0) app.fn.cambiar_seccion_tarea({'tarea': v_tarea, 'seccion': key.replace('mover-a-seccion-', ''), '$el': $el});
      if(key === 'eliminar_tarea') app.fn.confirmar_del_tarea({'tarea': v_tarea, '$el': $el});

    };
    
  };

  app.fn._callback_menu_contextual_campo_aux = function($el, key) {

    var v_campo = $el.data('campo-aux');
    var v_valor = key.replace('val-', '');
    if(v_valor === 'NULL') v_valor = '';

    var v_tarea = (app.tarea_actual != null) ? app.tarea_actual.codigo : $el.data('tarea');

    app.fn.set_tarea_campo_aux({
      'tarea': v_tarea,
      'campo': v_campo,
      'valor': v_valor
    });

  };

  app.fn._pulsar_filtro_buscador_avanzado = function(p_parametros) {

    var $t = p_parametros.elem;
    var v_activo = $t.closest('.sidebar-lista-item').hasClass('filtro-activo');
    $t.closest('.sidebar-lista').find('.filtro-activo').removeClass('filtro-activo');
    var v_val = '';

    if(!v_activo) {
      v_val = $t.data('valor');
      $t.closest('.sidebar-lista-item').addClass('filtro-activo');
    };

    var o = {}; o[p_parametros.filtro] = v_val;
    
    if(!app.fn.es_nulo(app.filtros.filtro_usuario_responsable) && app.filtros.filtro_usuario_responsable === app.opts.usuario.usuario) app.filtros.filtro_usuario_responsable = '';

    app.fn.cambiar_filtros(o);
    
  };
  
  app._buscador_tareas = {
    tareas: [],
    defaults: {
      tarea: null,
      limite: 8,
      mostrar_subtareas: false,
      callback: null
    },
    dom: {},
    seleccionado: 0,
    fn: {
      cargar_tareas: function(p_valor) {
        
        if(typeof p_valor === 'undefined') p_valor = '';

        var v_html = [];
        app._buscador_tareas.tarea_seleccionada = '';

        for(var i in app._buscador_tareas.tareas) {
          if(v_html.length > (app._buscador_tareas.opciones.limite - 1)) break;
          if(p_valor.length === 0 || app.fn.sql_like(app._buscador_tareas.tareas[i].nombre, '%' + p_valor + '%')) {
            v_html.push('<li class="seleccion-tarea" data-tarea="' + app._buscador_tareas.tareas[i].codigo + '">' + app._buscador_tareas.tareas[i].nombre + '</li>');
          };
        };

        if(v_html.length > (app._buscador_tareas.opciones.limite - 1)) v_html.push('<li>...</li>');

        app._buscador_tareas.dom.ul.empty().append( v_html.join('') ).find('li:first-child').addClass('seleccionado');
        app._buscador_tareas.seleccionado = 0;

      },
      navegar: function(p_delta) {

        var $lis = app._buscador_tareas.dom.ul.find('.seleccion-tarea').removeClass('seleccionado');
        var len = $lis.length - 1;

        if(len > 0) {
          if(p_delta === 1) {
            app._buscador_tareas.seleccionado += 1;
            if(app._buscador_tareas.seleccionado > len) app._buscador_tareas.seleccionado = 0;
          } else {
            app._buscador_tareas.seleccionado -= 1;
            if(app._buscador_tareas.seleccionado < 0) app._buscador_tareas.seleccionado = len;
          };
          $($lis[app._buscador_tareas.seleccionado]).addClass('seleccionado');
        };

      },
      preparar_dom: function() {

        app._buscador_tareas.dom.input = $('<input class="input-buscador-tarea" />').on('keyup', function(e) {
          if(e.keyCode === 27) {
            app.fn.desactivar_region_modal(app.tpl.region.aux_plugin);
          } else if(e.keyCode === 13) {
            app._buscador_tareas.dom.ul.find('.seleccionado').trigger('click');
          } else if(e.keyCode === 40) {
            // flecha abajo
            app._buscador_tareas.fn.navegar(1);
          } else if(e.keyCode === 38) {
            // flecha arriba
            app._buscador_tareas.fn.navegar(-1);
          } else {
            var v_val = $(this).val();
            app._buscador_tareas.fn.cargar_tareas(v_val);
          };
        }).appendTo(app.tpl.region.aux_plugin);
  
        app._buscador_tareas.dom.ul = $('<ul class="lista-buscador-tarea">').on('click', '.seleccion-tarea', function() {
          app._buscador_tareas.tarea_seleccionada = $(this).data('tarea');
          if(typeof app._buscador_tareas.opciones.callback === 'function') app._buscador_tareas.opciones.callback.call();
        }).appendTo(app.tpl.region.aux_plugin);

      }
    },
    iniciar: function(p_opciones) {

      if(typeof p_opciones === 'undefined') p_opciones = {};

      app._buscador_tareas.opciones = app.fn.unir(app._buscador_tareas.defaults, p_opciones);

      app._buscador_tareas.tareas = [];

      for(var i in app.proyecto_actual.tareas) {
        var t = app._tareas[app.proyecto_actual.tareas[i]['i']];
        if(t.codigo != app._buscador_tareas.opciones.tarea.codigo && t.status != 'F' && t.depende_de_tarea != app._buscador_tareas.opciones.tarea.codigo && (t.tarea_padre === '' || t.tarea_padre === app._buscador_tareas.opciones.tarea.tarea_padre)) {
          app._buscador_tareas.tareas.push(t);
        };
      };

      app._buscador_tareas.fn.preparar_dom();

      app._buscador_tareas.fn.cargar_tareas('');

      app._buscador_tareas.dom.input.focus();

    }
  };

  app._buscador_expedientes = {
    lineas: [],
    defaults: {
      tarea: null,
      callback: null
    },
    dom: {},
    fn: {
      cargar_expedientes: function(p_valor) {
        
        if(typeof p_valor === 'undefined') p_valor = '';

        var v_html = [];
        app._buscador_expedientes.linea_seleccionada = '';

        for(var i in app._buscador_expedientes.lineas) {
          var v_data = app._buscador_expedientes.lineas[i];
          v_html.push('<li class="seleccion-expediente" data-el="' + v_data.numero_expediente + '#' +  v_data.numero_linea + '"><div class="ficha-expediente"><header><p class="tipo">' + v_data.tipo_expediente + '</p><p class="explin">' + v_data.numero_expediente + ((v_data.numero_linea != '') ? '/' + v_data.numero_linea : '') + '</p></header><section><p class="p1">' + v_data.entidad + '</p><p class="p1">' + v_data.descripcion + '</p></section></div></li>');
        };

        app._buscador_expedientes.dom.ul.empty().append( v_html.join('') );

      },
      cargar_lista: function() {

        var v_filtros = {
          'numero_expediente': app._buscador_expedientes.dom.input_expediente.val(),
          'numero_linea': app._buscador_expedientes.dom.input_linea.val(),
          'entidad': app._buscador_expedientes.dom.input_entidad.val(),
          'descripcion': app._buscador_expedientes.dom.input_descripcion.val()
        };

        if(v_filtros.numero_expediente === '' && v_filtros.numero_linea === '' && v_filtros.entidad === '' && v_filtros.descripcion === '') return false;

        app._buscador_expedientes.dom.ul.empty().append( app.fn.generar_loader({'clase': 'lista-loading'}) );

        app._buscador_expedientes.lista = new app.ob.lista();

        var v_opciones_lista = {
          'bloque': app.erp.v_crm_expedientes,
          'pintar_lista': false,
          'forzar_inicio': 1,
          'forzar_fin': 999,
          'filtros': v_filtros,
          'after': function(p_lista){

            app._buscador_expedientes.lineas = [];

            for(var i in p_lista.data.rows) {

              var e = p_lista.data.rows[i];

              var v_elem = {
                'numero_expediente': e['c1'],
                'numero_linea': e['c2'],
                'tipo_expediente': e['c3'],
                'entidad': e['c4'],
                'descripcion': e['c5']
              };

              app._buscador_expedientes.lineas.push(v_elem);

            };

            app._buscador_expedientes.fn.cargar_expedientes('');

          }
        };
        
        app._buscador_expedientes.lista.init(v_opciones_lista);

      },
      preparar_dom: function() {

        app._buscador_expedientes.dom.wrapper = $('<div class="wrapper-input-buscador"></div>').appendTo(app.tpl.region.aux_plugin);

        app._buscador_expedientes.dom.input_expediente = $('<input class="input-buscador" placeholder="' + app.opts.lang.crm_numero_expediente + '" />').appendTo( app._buscador_expedientes.dom.wrapper );
        app._buscador_expedientes.dom.input_linea = $('<input class="input-buscador" placeholder="' + app.opts.lang.crm_numero_linea + '" />').appendTo( app._buscador_expedientes.dom.wrapper );
        app._buscador_expedientes.dom.input_entidad = $('<input class="input-buscador" placeholder="' + app.opts.lang.crm_entidad + '" />').appendTo( app._buscador_expedientes.dom.wrapper );
        app._buscador_expedientes.dom.input_descripcion = $('<input class="input-buscador " placeholder="' + app.opts.lang.descripcion + '" />').appendTo( app._buscador_expedientes.dom.wrapper );

        app._buscador_expedientes.dom.wrapper.find('.input-buscador').on('keyup', function(e) {
          if(e.keyCode === 27) {
            app.fn.desactivar_region_modal(app.tpl.region.aux_plugin);
          } else if(e.keyCode === 13) {
            var v_val = $(this).val();
            app._buscador_expedientes.fn.cargar_lista();
          };
        }).appendTo( app._buscador_expedientes.dom.wrapper );
  
        app._buscador_expedientes.dom.ul = $('<ul class="lista-buscador-expediente">').on('click', '.seleccion-expediente', function() {
          app._buscador_expedientes.linea_seleccionada = $(this).data('el');
          if(typeof app._buscador_expedientes.opciones.callback === 'function') app._buscador_expedientes.opciones.callback.call();
        }).appendTo(app.tpl.region.aux_plugin);

      }
    },
    iniciar: function(p_opciones) {

      if(typeof p_opciones === 'undefined') p_opciones = {};

      app._buscador_expedientes.opciones = app.fn.unir(app._buscador_expedientes.defaults, p_opciones);

      app._buscador_expedientes.fn.preparar_dom();

      app._buscador_expedientes.dom.input_expediente.focus();

    }
  };

  app._buscador_permisos = {
    permisos: [],
    defaults: {
      limite: 8,
      callback: null
    },
    dom: {},
    seleccionado: 0,
    lista: null,
    fn: {
      cargar_permisos: function(p_valor) {
        
        if(typeof p_valor === 'undefined') p_valor = '';
        p_valor = p_valor.toLowerCase();
        p_valor = p_valor.replace(/ /g, '%');

        var v_html = [];
        app._buscador_permisos.permiso_seleccionado = {};

        for(var i in app._buscador_permisos.permisos) {

          if(v_html.length > (app._buscador_permisos.opciones.limite - 1)) break;
          var e = app._buscador_permisos.permisos[i];

          var v_cargar = true;
          var v_prop = (e.tipo === 'U') ? 'usuario' : ((e.tipo === 'E') ? 'equipo': 'perfile');
         
         if(app.proyecto_actual.usuarios.length > 0) {
          for(var i in app.proyecto_actual.usuarios) {
            var v_usu = app.proyecto_actual.usuarios[i];
            if(typeof v_usu[v_prop] != 'undefined' && v_usu[v_prop] === e.codigo ) {
              v_cargar = false;
              break;
            };
          };
         };
         
          if(v_cargar && (p_valor.length === 0 || app.fn.sql_like(e._buscador, '%' + p_valor + '%'))) {
            v_html.push('<li class="seleccion-permiso" data-tipo="' + e.tipo + '" data-codigo="' + e.codigo + '">' + e._avatar + e.descripcion + '</li>');
          };

        };

        if(v_html.length > (app._buscador_permisos.opciones.limite - 1)) v_html.push('<li>...</li>');

        app._buscador_permisos.dom.ul.empty().append( v_html.join('') ).find('li:first-child').addClass('seleccionado');
        app._buscador_permisos.seleccionado = 0;

        app._buscador_permisos.dom.input[0].focus();

      },
      cargar_lista: function() {

        app._buscador_permisos.dom.input.attr('disabled', true);
        app._buscador_permisos.dom.ul.append( app.fn.generar_loader({'clase': 'lista-loading'}) );

        app._buscador_permisos.lista = new app.ob.lista();

        var v_opciones_lista = {
          'bloque': app.erp.v_origenes_permisos,
          'pintar_lista': false,
          'forzar_inicio': 1,
          'forzar_fin': 9999,
          'filtros': {
            'proyecto': app.proyecto_actual.codigo
          },
          'after': function(p_lista){

            app._buscador_permisos.permisos = [];

            if(typeof app.permisos.equipos === 'undefined')  app.permisos.equipos = {};
            if(typeof app.permisos.perfiles === 'undefined')  app.permisos.perfiles = {};
            if(typeof app.permisos.usuarios === 'undefined')  app.permisos.usuarios = {};

            for(var i in p_lista.data.rows) {

              var e = p_lista.data.rows[i];
              var v_elem = {
                'tipo': e['c1'],
                'codigo': e['c2'],
                'descripcion': e['c3'],
                '_buscador': e['c2'].toLowerCase() + ' ' + e['c3'].toLowerCase()
              };

              if(v_elem.tipo === 'U') {
                v_elem._avatar = app.fn._get_avatar_usuario({'usuario': v_elem.codigo, 'clase': 'mr1'});
              } else {
                v_elem._avatar = app.fn._get_avatar_origen({'tipo': v_elem.tipo, 'clase': 'mr1'});
              };

              app._buscador_permisos.permisos.push(v_elem);

            };

            app._buscador_permisos.dom.input.attr('disabled', false);
            app._buscador_permisos.fn.cargar_permisos('');

          }
        };
        
        app._buscador_permisos.lista.init(v_opciones_lista);

      },
      navegar: function(p_delta) {

        var $lis = app._buscador_permisos.dom.ul.find('.seleccion-permiso').removeClass('seleccionado');
        var len = $lis.length - 1;

        if(len > 0) {
          if(p_delta === 1) {
            app._buscador_permisos.seleccionado += 1;
            if(app._buscador_permisos.seleccionado > len) app._buscador_permisos.seleccionado = 0;
          } else {
            app._buscador_permisos.seleccionado -= 1;
            if(app._buscador_permisos.seleccionado < 0) app._buscador_permisos.seleccionado = len;
          };
          $($lis[app._buscador_permisos.seleccionado]).addClass('seleccionado');
        };

      },
      preparar_dom: function() {

        app._buscador_permisos.dom.input = $('<input class="input-buscador-permiso" />').on('keyup', function(e) {
          if(e.keyCode === 27) {
            app.fn.desactivar_region_modal(app.tpl.region.aux_plugin);
          } else if(e.keyCode === 13) {
            app._buscador_permisos.dom.ul.find('.seleccionado').trigger('click');
          } else if(e.keyCode === 40) {
            // flecha abajo
            app._buscador_permisos.fn.navegar(1);
          } else if(e.keyCode === 38) {
            // flecha arriba
            app._buscador_permisos.fn.navegar(-1);
          } else {
            var v_val = $(this).val();
            app._buscador_permisos.fn.cargar_permisos(v_val);
          };
        }).appendTo(app.tpl.region.aux_plugin);
  
        app._buscador_permisos.dom.ul = $('<ul class="lista-buscador-permiso">').on('click', '.seleccion-permiso', function() {
          var $t = $(this);
          app._buscador_permisos.permiso_seleccionado = {
            'tipo_autorizacion': $t.data('tipo'),
            'codigo': $t.data('codigo'),
            'supervisor': ((app._buscador_permisos.dom.supervisor.find('input').prop('checked')) ? 'S' : 'N')
          };
          if(typeof app._buscador_permisos.opciones.callback === 'function') app._buscador_permisos.opciones.callback.call();
        }).appendTo(app.tpl.region.aux_plugin);

        app._buscador_permisos.dom.supervisor = $('<div class="field d100" rel="p_supervisor"><div class="label" rel="p_supervisor"><label for="p_supervisor">' + app.opts.lang.supervisor + '</label></div><div class="input" rel="p_supervisor"><input id="p_supervisor" rel="p_supervisor" name="p_supervisor" type="checkbox" class="tal icon icon-check nodesc" value="N" autocomplete="off"></div></div>').appendTo(app.tpl.region.aux_plugin);

      }
    },
    iniciar: function(p_opciones) {

      if(typeof p_opciones === 'undefined') p_opciones = {};

      app._buscador_permisos.opciones = app.fn.unir(app._buscador_permisos.defaults, p_opciones);

      app._buscador_permisos.fn.preparar_dom();

      if(app._buscador_permisos.permisos.length === 0) {
        app._buscador_permisos.fn.cargar_lista();
      } else {
        app._buscador_permisos.fn.cargar_permisos('');
      };

      app._buscador_permisos.dom.input.focus();

    }
  };

  app.fn.restablecer_agrupacion_vista = function() {

    app.agrupacion = '';
    app.tpl.gtd.agrupacion_vista.find('.lbl').html( app.opts.lang.seccion );

  };

  app.fn.cambiar_agrupacion_vista = function(p_opciones) {

    if(typeof p_opciones === 'undefined') p_opciones = {'modo': ''};

    if(p_opciones.modo === '' || p_opciones.modo === 'seccion') {

      app.fn.restablecer_agrupacion_vista();

    } else {

      app.agrupacion = p_opciones.modo;

      var v_titulo = p_opciones.$elem.find('.lbl').html();
      app.tpl.gtd.agrupacion_vista.find('.lbl').html( v_titulo );

    };

    if(app.agrupacion != '') app.ordenacion.ordenar_por_seccion = 'S';

    if(app.agrupacion != '' && app.agrupacion === app.ordenacion.campo) app.fn.restablecer_ordenacion_tareas();

    delete app._hash_peticion_actual;
    app.fn.cargar_gtd();

  };

  app.fn.restablecer_ordenacion_tareas = function() {

    app.ordenacion.campo = '';
    app.ordenacion.modo = 'asc';
    app.ordenacion.tipo = 'NUMBER';
    app.ordenacion.ordenar_por_seccion = 'S';

    app.tpl.gtd.ordenacion_tareas.find('.lbl').html( app.opts.lang.ordenacion );
    app.tpl.gtd.ordenacion_tareas.find('.icon').removeClass('icon-sort-amount-down icon-sort-amount-up').addClass('icon-sort-alt');

  };

  app.fn.cambiar_ordenacion_tareas = function(p_opciones) {

    if(typeof p_opciones === 'undefined') p_opciones = {'modo': ''};

    if(typeof p_opciones.ordenar_por_seccion === 'undefined') {

      if(app.ordenacion.campo === p_opciones.modo) app.ordenacion.modo = (app.ordenacion.modo === 'asc') ? 'desc' : 'asc';

      app.ordenacion.campo = p_opciones.modo;
      app.ordenacion.tipo = p_opciones.$elem.find('.lbl').data('tipo');

      if(p_opciones.modo != '') {

        var v_icono = 'icon-sort-amount-' + ((app.ordenacion.modo === 'asc') ? 'down' : 'up');

        app.tpl.gtd.ordenacion_tareas.find('.lbl').html( p_opciones.$elem.find('.lbl').html() );
        app.tpl.gtd.ordenacion_tareas.find('.icon').removeClass('icon-sort-alt icon-sort-amount-down icon-sort-amount-up').addClass(v_icono);

      } else {

        app.fn.restablecer_ordenacion_tareas();

      };

    } else {

      app.ordenacion.ordenar_por_seccion = p_opciones.ordenar_por_seccion;
      app.fn.restablecer_agrupacion_vista();

    };

    if(app.ordenacion.campo != '' && app.ordenacion.campo === app.agrupacion) app.fn.restablecer_agrupacion_vista();

    delete app._hash_peticion_actual;
    app.fn.cargar_gtd();

  };

  app.fn.cambiar_contador_tareas_seccion = function(p_modo) {

    app.parametros.contador_tareas_seccion = p_modo;
    app.fn.cambiar_vista_proyecto();

    app.fn.enviar_beacon(app.opts.api + app.opts.modulo + '/set_opcion_usuario', {'opcion': 'CONTADOR_TAREAS_SECCION', 'valor': app.parametros.contador_tareas_seccion});

  };

  app.fn.cambiar_barra_lateral = function() {

    if(app.parametros.ocultar_barra_lateral === 'O') return;

    app.parametros.ocultar_barra_lateral = (app.parametros.ocultar_barra_lateral === 'S') ? 'N' : 'S';

    app.tpl.gtd.sidebar.toggleClass('colapsada', (app.parametros.ocultar_barra_lateral === 'S'));
    
    app.fn.enviar_beacon(app.opts.api + app.opts.modulo + '/set_opcion_usuario', {'opcion': 'OCULTAR_BARRA_LATERAL', 'valor': app.parametros.ocultar_barra_lateral});

  };

  app.fn.cambiar_filtro_status_tarea = function(p_modo) {

    app.parametros.filtro_status_tarea = p_modo;

    app.fn._set_titulo_filtro_status_tarea();

    /*if(app.parametros.etiqueta != '') {
      app.fn.cambiar_vista_etiqueta();
    } else if(app.parametros.proyecto != '') {
      if(app.proyecto_actual != null) app.proyecto_actual._recargar_secciones(); 
      app.fn.cambiar_vista_proyecto();
    } else {
      app.fn.cambiar_vista_buscador();
    };*/

    app.fn.enviar_beacon(app.opts.api + app.opts.modulo + '/set_opcion_usuario', {'opcion': 'FILTRO_STATUS_TAREA', 'valor': app.parametros.filtro_status_tarea});

    app.fn.cargar_gtd();

  };

  app.fn._set_titulo_filtro_status_tarea = function() {

    var v_titulo = '';
    switch (app.parametros.filtro_status_tarea) {
      case 'P':
        v_titulo = app.opts.lang.tareas_sin_finalizar;
        break;
      case 'F':
        v_titulo = app.opts.lang.tareas_finalizadas;
        break;
      case 'T':
        v_titulo = app.opts.lang.todas_las_tareas;
        break;
      default:
        break;
    };

    app.tpl.gtd.filtro_status_tarea.find('.lbl').html( v_titulo );

  };

  app.fn._restablecer_parametros_vista = function(p_opciones) {

    if(typeof p_opciones === 'undefined') p_opciones = {};
    if(typeof p_opciones.limpiar_filtros === 'undefined') p_opciones.limpiar_filtros = true;

    app.parametros.proyecto = '';
    app.parametros.etiqueta = '';
    app._buscador_permisos.permisos = [];
    
    app.fn.restablecer_agrupacion_vista();
    app.fn.restablecer_ordenacion_tareas();
    
    //app.parametros.filtro_status_tarea = 'P';
    //app.tpl.gtd.filtro_status_tarea.find('.lbl').html( app.opts.lang.tareas_sin_finalizar );
    
    if(p_opciones.limpiar_filtros) app.fn.limpiar_filtros();

    app.tpl.gtd.panel.addClass('dom-cargando');
    
  };

  app.fn.cambiar_proyecto = function(p_proyecto) {

    if(app.proyecto_actual === null || p_proyecto.codigo != app.proyecto_actual.codigo) {

      app.fn._restablecer_parametros_vista();
      app.parametros.proyecto = p_proyecto.codigo;
      app.fn.cargar_gtd();

      app.fn.enviar_beacon(app.opts.api + app.opts.modulo + '/set_opcion_usuario', {'opcion': 'ULTIMO_PROYECTO', 'valor': app.proyecto_actual.codigo});

    };

  };

  app.fn.cambiar_etiqueta = function(p_etiqueta) {

    if(app.etiqueta_actual === null || p_etiqueta.codigo != app.etiqueta_actual.codigo) {
      app.fn._restablecer_parametros_vista();
      app.tpl.gtd.agrupacion_vista.hide();
      app.parametros.etiqueta = p_etiqueta.codigo;
      app.fn.cargar_gtd();
    };

  };

  app.fn.cambiar_filtros = function(p_filtros) {

    app.fn._restablecer_parametros_vista({"limpiar_filtros": false});
    app.tpl.gtd.agrupacion_vista.hide();

    app.filtros = app.fn.unir(app.filtros, p_filtros);

    app.tpl.gtd.sidebar.find('.sidebar-buscador').find('input').val(app.filtros.filtro_texto);

    var v_activo = (!app.fn.es_nulo(app.filtros.filtro_texto) || (!app.fn.es_nulo(app.filtros.filtro_usuario_responsable) && app.filtros.filtro_usuario_responsable !== app.opts.usuario.usuario) || !app.fn.es_nulo(app.filtros.filtro_fecha));
    
    app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.btn-limpiar-buscador').toggle(v_activo);

    delete app._hash_peticion_actual;

    app.fn.cargar_gtd();

  };

  app.fn.cambiar_vista_etiqueta = function(p_opciones) {

    if(typeof p_opciones === 'undefined') p_opciones = {};

    app.vista_actual = 'lista';
    app.fn.ocultar_detalle_tarea();

    app.tpl.gtd.menu_tabs.hide();
    app.tpl.gtd.filtros.show();

    if(typeof app.sortable != 'undefined' && app.sortable.secciones != null) sortable('.sortable-panel-' + app.vista_actual, 'destroy');
    app.tpl.gtd[app.vista_actual].empty();
    app.tpl.gtd[app.vista_actual].parent().hide();

    if(typeof app.sortable != 'undefined' && app.sortable.tareas != null) sortable('.sortable-panel-tareas', 'destroy');

    app.tpl.gtd.proyecto.find('.gtd-panel-wrapper').hide();
    app.tpl.gtd[app.vista_actual].parent().show();

    app.fn.vista_tareas_etiqueta();

  };

  app.fn.vista_tareas_etiqueta = function() {

    app.etiqueta_actual.secciones = [];

    var v_agrupar_tareas = (app.ordenacion.campo != '' && app.ordenacion.ordenar_por_seccion !== 'S');
    var v_proyectos = {};

    for(var i in app._tareas) {
      var t = app._tareas[i];
      for(var p in t.secciones) {
        if(t.etiquetas.indexOf(app.parametros.etiqueta) >= 0) {
          if(app.parametros.filtro_status_tarea === 'T' || t.status === app.parametros.filtro_status_tarea) {
            var v_pos = (!v_agrupar_tareas) ? p : 'O';
            if(typeof v_proyectos[v_pos] === 'undefined') v_proyectos[v_pos] = [];
            v_proyectos[v_pos].push({'i': parseInt(i), '_campo_ordenacion': t._get_campo_ordenacion(i)});
          };
        };
      };
    };

    //TODO: unificar con el buscador
    var s = null;

    if(v_agrupar_tareas) {
      s = new app._seccion({'codigo': 'NULL', 'nombre': '&nbsp;', 'orden': -1});
      app.etiqueta_actual.secciones.push(s);
      app.tpl.gtd[app.vista_actual].append( s._actualizar_dom() );
    };

    for(var i in v_proyectos) {

      var p = null;
      if(!v_agrupar_tareas) p = app.fn.buscar_por_id(app._proyectos, 'codigo', parseInt(i));
      if(p != null || v_agrupar_tareas) { 

        if(!v_agrupar_tareas) {
          s = new app._seccion({'codigo': p.codigo, 'nombre': p.nombre, 'modificable': false, 'proyecto': p.codigo});
          app.etiqueta_actual.secciones.push(s);
          app.tpl.gtd[app.vista_actual].append( s._actualizar_dom() );
        };

        if(app.ordenacion.campo !== '') {
          app.fn.ordenar_array_sql(v_proyectos[i], {"_campo_ordenacion":[app.ordenacion.modo, app.ordenacion.tipo]});
        };

        for(var j in v_proyectos[i]) {
          var t = app._tareas[v_proyectos[i][j]['i']];
          s.$dom.find('.sortable-panel-tareas').append( t._actualizar_dom({'sortable': false}) );
        };
      };

    };

  };

  app.fn.cambiar_vista_buscador = function(p_opciones) {

    if(typeof p_opciones === 'undefined') p_opciones = {};

    app.vista_actual = 'lista';
    app.fn.ocultar_detalle_tarea();

    app.tpl.gtd.menu_tabs.hide();
    app.tpl.gtd.filtros.show();

    if(typeof app.sortable != 'undefined' && app.sortable.secciones != null) sortable('.sortable-panel-' + app.vista_actual, 'destroy');
    app.tpl.gtd[app.vista_actual].empty();
    app.tpl.gtd[app.vista_actual].parent().hide();
    
    if(typeof app.sortable != 'undefined' && app.sortable.tareas != null) sortable('.sortable-panel-tareas', 'destroy');

    app.tpl.gtd.proyecto.find('.gtd-panel-wrapper').hide();
    app.tpl.gtd[app.vista_actual].parent().show();

    app.fn.vista_tareas_buscador();

  };

  app.fn.vista_tareas_buscador = function() {

    app.tpl.gtd[app.vista_actual].empty();

    var v_agrupar_tareas = (app.ordenacion.campo != '' && app.ordenacion.ordenar_por_seccion !== 'S');
    var v_hay_tareas = false;
    var v_proyectos = {};

    for(var i in app._tareas) {

      var t = app._tareas[i];

      var v_incluir = (app.parametros.filtro_status_tarea === 'T' || t.status === app.parametros.filtro_status_tarea);
      if(typeof t._ocultar != 'undefined' && t._ocultar === 'S') v_incluir = false;
      
      if(v_incluir) {

        for(var p in t.secciones) {
          var v_pos = (!v_agrupar_tareas) ? p : 'O';
          if(typeof v_proyectos[v_pos] === 'undefined') v_proyectos[v_pos] = [];
          v_proyectos[v_pos].push({'i': parseInt(i), '_campo_ordenacion': t._get_campo_ordenacion(i)});
        };

        v_hay_tareas = true;

      };

    };

    if(v_hay_tareas) {

      var s = null;

      if(v_agrupar_tareas) {
        s = new app._seccion({'codigo': 'NULL', 'nombre': '&nbsp;', 'orden': -1});
        //app.etiqueta_actual.secciones.push(s);
        app.tpl.gtd[app.vista_actual].append( s._actualizar_dom() );
      };

      for(var i in v_proyectos) {

        var p = null;
        if(!v_agrupar_tareas) p = app.fn.buscar_por_id(app._proyectos, 'codigo', parseInt(i));
        if(p != null || v_agrupar_tareas) { 

          if(!v_agrupar_tareas) {
            s = new app._seccion({'codigo': p.codigo, 'nombre': p.nombre, 'modificable': false, 'proyecto': p.codigo});
            //app.etiqueta_actual.secciones.push(s);
            app.tpl.gtd[app.vista_actual].append( s._actualizar_dom() );
          };

          if(app.ordenacion.campo !== '') {
            app.fn.ordenar_array_sql(v_proyectos[i], {"_campo_ordenacion":[app.ordenacion.modo, app.ordenacion.tipo]});
          };

          for(var j in v_proyectos[i]) {
            var t = app._tareas[v_proyectos[i][j]['i']];
            s.$dom.find('.sortable-panel-tareas').append( t._actualizar_dom({'sortable': false, 'buscador': true}).clone(true) );
          };
        };

      };

    };

  };

  app.fn.cambiar_vista_proyecto = function(p_opciones) {

    if(typeof p_opciones === 'undefined') p_opciones = {};
    if(typeof p_opciones.vista === 'undefined') p_opciones.vista = (app.vista_actual || app.parametros.vista_inicial);
    if(typeof p_opciones.limpiar_dom_proyecto === 'undefined') p_opciones.limpiar_dom_proyecto = true;
    if(typeof p_opciones.ocultar_tarea_activa === 'undefined') p_opciones.ocultar_tarea_activa = true;
    
    if(app.tarea_actual === null) p_opciones.ocultar_tarea_activa = true;

    if(!p_opciones.ocultar_tarea_activa) {
      var i = app.fn.buscar_index_por_id(app._tareas, 'codigo', app.tarea_actual.codigo);
      if(i < 0) p_opciones.ocultar_tarea_activa = true;
    };

    if(p_opciones.ocultar_tarea_activa) {
      app.fn.ocultar_detalle_tarea();
    } else {
      if(app.tarea_actual != null) {
        // forzamos la recarga de la variable de la tarea actual, por si ha cambiado
        app.tarea_actual = app.fn.buscar_por_id(app._tareas, 'codigo', app.tarea_actual.codigo);
        app.tarea_actual._actualizar_dom();
        app.fn.preparar_dom_detalle_tarea();
      };
    };
    
    app.tpl.gtd.menu_tabs.show();
    app.tpl.gtd.menu_tabs.find('button').removeClass('activo');
    app.tpl.gtd.menu_tabs.find('#vista-' + p_opciones.vista).addClass('activo');

    if(app.vista_actual != null) {
      if(app.proyecto_actual != null && app.proyecto_actual.es_modificable() && (app.vista_actual === 'lista' || app.vista_actual === 'tablero')) {
        if(app.sortable.secciones != null && app.proyecto_actual.es_modificable()) {
          try {
            sortable('.sortable-panel-' + app.vista_actual, 'destroy');
          } catch(e) {
            console.log(e);
          };
        };
      };
      app.tpl.gtd[app.vista_actual].empty();
      app.tpl.gtd[app.vista_actual].parent().hide();
    };

    if(app.sortable.tareas != null) sortable('.sortable-panel-tareas', 'destroy');

    app.vista_actual = p_opciones.vista;

    app.tpl.gtd[app.vista_actual].empty().parent().show();

    if(app.vista_actual != null) {
      if(app.proyecto_actual != null) {
        if(app.vista_actual === 'lista' || app.vista_actual === 'tablero') {
          app.tpl.gtd.filtros.show();
          app.tpl.gtd.agrupacion_vista.show();
          app.tpl.gtd.ordenacion_tareas.show();
          app.fn.vista_tareas_proyecto();
        } else if(app.vista_actual === 'resumen') {
          app.tpl.gtd.filtros.hide();
          app.fn.vista_resumen_proyecto();
        } else if(app.vista_actual === 'calendario') {
          app.fn.vista_calendario();
        };
      };
    };

    if(p_opciones.limpiar_dom_proyecto) app.fn.limpiar_dom_proyecto();

  };

  app.fn.vista_tareas_proyecto = function() {

    app.fn.ordenar_array_sql(app.proyecto_actual.secciones, {"orden":["asc","NUMBER"],"nombre":["asc"]});

    for(var i in app.proyecto_actual.secciones) {
      var s = app.proyecto_actual.secciones[i];
      app.tpl.gtd[app.vista_actual].append( s._actualizar_dom() );
    };

    if(app.proyecto_actual.es_modificable()) {

      if(app.fn._puede_ordenar_tareas()) {
        
        app.tpl.gtd[app.vista_actual].append( new app._btn_nueva_seccion );

        app.sortable.secciones = sortable('.sortable-panel-' + app.vista_actual, {
          forcePlaceholderSize: true,
          handle: (app.vista_actual === 'lista') ? '.btn-handle' : '.seccion-proyecto-header',
          items: '.seccion-proyecto',
          placeholder: '<li class="seccion-proyecto seccion-proyecto-placeholder"></li>'
        });

        $('.sortable-panel-' + app.vista_actual).off('sortstart').on('sortstart', function(e) {
          app.fn.desactivar_timeout();
        }).off('sortstop').on('sortstop', function(e) {
          app.fn.activar_timeout();
        }).off('sortupdate').on('sortupdate', function(e) {

          var s = $(e.detail.item).data('seccion');
          if(!app.fn.es_nulo(s)) {
            s = app.fn._get_seccion(s);

            app.fn.upd_seccion({
              'seccion': s,
              'campo': 'ORDEN',
              'valor': e.detail.destination.index
            });

          };

        });

      } else {
        app.sortable.secciones = null;
      };

    };

  };

  app.fn.vista_resumen_proyecto = function() {

    app.fn.anular_peticion_actual();

    app.tpl.gtd.resumen.empty();

    app.navs_actuales = app.tpl.nav.find('button').not('.oculto');

    app.proyecto_actual._resumen_proyecto();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/get_clob_proyecto', {'proyecto': app.proyecto_actual.codigo}, function(data) {

      delete app.peticion_actual;

      if(data.resultado === 'OK') {

        var v_json = JSON.parse(data.datos);
        app.proyecto_actual.descripcion = v_json.descripcion;

        app.fn.procesar_resumen_proyecto();

      };

    });
    
  };

  app.fn.procesar_resumen_proyecto = function() {

    // DESCRIPCION

    $el = $('#proyecto-descripcion').val(app.proyecto_actual.descripcion);
    $el.parent().find('.text__loading').remove();

    if(app.proyecto_actual.es_modificable()) {

      app.fn.ejecutar_plugin('richeditor', function() {

        var v_id = 'proyecto-descripcion';
        $('#' + v_id).find('.richeditor-textarea').hide();
        if(typeof app._richeditors === 'undefined') app._richeditors = [];
        app._richeditors[v_id] = new app.fn.richeditor();
        app._richeditors[v_id].iniciar(app, {
          'editor': '#' + v_id,
          'opciones_basicas': 'S',
          'ocultar_interfaz': true,
          'placeholder': app.opts.lang.ph_proyecto_descripcion,
          'eventos': {
            'focus': function(e) {
              app.fn.desactivar_timeout();
            },
            'blur': function(e) {

              var v_val = $(this.dom.textarea).val();

              if(app.proyecto_actual.descripcion != v_val) {
                app.fn.upd_proyecto({
                  'tarea': app.proyecto_actual,
                  'campo': 'DESCRIPCION',
                  'valor_clob': v_val
                });
              };

              app.fn.activar_timeout();

            }
          }
        });

      }, 'files/assets/fn/richeditor', app.fn);

    } else {
      $el.show();
    };

  };

  app.fn.vista_calendario = function() {

    app.tpl.gtd.filtros.show();
    app.tpl.gtd.agrupacion_vista.hide();
    app.tpl.gtd.ordenacion_tareas.hide();

    app.fn.ejecutar_plugin('calendario_movilidad', function() {

      if(typeof app.calendario_movilidad === 'undefined') {
        
        app.calendario_movilidad = new app.ob.calendario_movilidad();

        app.calendario_movilidad.destruir();

        // registramos el calendario por defecto
        app.calendario_movilidad.borrar_calendarios();

        var v_color = app.colores['BLUE_GREY'];

        if(app.proyecto_actual != 'null' && app.proyecto_actual.color != '') {
          v_color = app.colores[app.proyecto_actual.color.toUpperCase()];
        };

        app.calendario_movilidad.registrar_calendario({
          'id': 'gtd',
          'nombre': app.erp.titulo_erp,
          'checked': true,
          'color': v_color.alt,
          'color_fondo': v_color.color,
          'color_borde': v_color.color
        });

      };

      app.fn.cargar_vista_calendario();

    }, 'files/assets/ob/calendario_movilidad', app.ob);

  };

  app.fn.cargar_vista_calendario = function(p_opciones) {

    app.tpl.gtd.calendario.empty();

    app.tpl.calendario_wrapper = $('<div class="calendario-wrapper"></div>').appendTo( app.tpl.gtd.calendario );

      app.tpl.calendario_content = $('<section class="calendario-content"></section>').appendTo( app.tpl.calendario_wrapper );
      app.tpl.calendario_lista_calendarios = $('<section class="calendario-lista"><div class="titulo"><span>' + app.opts.lang.calendarios + '</span></div></section>').hide().appendTo( app.tpl.calendario_wrapper );

      app.tpl.calendario_wrapper_vistas = $('<div class="calendario-wrapper-vistas"></div>').appendTo( app.tpl.calendario_content );
      app.tpl.calendario_wrapper_cal = $('<div class="calendario-wrapper-cal" id="mwlcal"></div>').appendTo( app.tpl.calendario_content );

      app.calendario_movilidad.inicializar(app, {
        'wrapper': '#mwlcal',
        'vistas_disponibles': ['DOS_SEMANAS', 'MES', 'ANUAL'],
        'vista_calendario': ((typeof app._vista_calendario != 'undefined') ? app._vista_calendario : 'MES'),
        'fecha_inicial': ((typeof app._fecha_calendario != 'undefined') ? app._fecha_calendario : ''),
        'plantilla_entrada_calendario': app.fn.plantilla_evento_calendario,
        'eventos': {
          'pulsar_entrada': app.fn.pulsar_entrada_calendario,
          'seleccionar_rango_fechas': app.fn.pre_crear_entrada_calendario,
          'modificar_fechas_entrada': app.fn.modificar_fechas_entrada,
          'cambiar_fecha_calendario': app.fn.cambiar_fecha_vista_calendario,
          'cambiar_vista_calendario': app.fn.cambiar_fecha_vista_calendario
        },
        'dom': {
          'wrapper_navegacion': app.tpl.calendario_wrapper_vistas,
          'wrapper_calendarios': app.tpl.calendario_lista_calendarios
        }
      }, function() {

        app.fn.recargar_calendario_actual();

      });

  };

  app.fn.recargar_calendario_actual = function() {

    app.fn.cargar_eventos_calendario({}, function() {
      app.fn.crear_entradas_calendario();
    });

  };

  app.fn.cargar_eventos_calendario = function(p_opciones, p_callback) {

    if(typeof p_opciones === 'undefined') p_opciones = {};
    
    var v_backdrop = $('<div class="backdrop in calendario-backdrop"><div class="bar b-t b-info" style="display:block;width:0"></div><div class="progress loadlist"><div class="indeterminate"></div></div></div>').prependTo(app.tpl.region.calendario).prependTo(app.tpl.gtd.calendario);

    if(typeof p_callback === 'function') p_callback.call();
  
    app.tpl.gtd.calendario.find('.calendario-backdrop').remove();

  };

  app.fn.crear_entradas_calendario = function() {

    if(typeof app.calendario_movilidad === 'undefined') return;

    app._entradas = [];

    for(var i in app._tareas) {

      var t = app._tareas[i];

      if(app.parametros.filtro_status_tarea === 'T' || t.status === app.parametros.filtro_status_tarea) {

        if(t.fecha_entrega != '') {
            
          var v_color = false;

          if(app.proyecto_actual != 'null') {
            var o = ((t.tarea_padre === '') ? t : t._get_tarea_origen() );
            if(typeof o.secciones[app.proyecto_actual.codigo] != 'undefined') {
              v_color = app.colores[app.proyecto_actual.color.toUpperCase()];
            };
          } else {
            v_color = {
              'color': app.calendario_movilidad.calendarios[0].bgColor,
              'alt': app.calendario_movilidad.calendarios[0].color
            };
          };

          if(v_color) {

            if(t.status === 'F') v_color = {'color': '#669900', 'alt': '#fff'};

            var v_ev = app.calendario_movilidad.generar_entrada_base({
              'id_calendario': 'gtd',
              'id': t.codigo,
              'titulo': t.nombre,
              'todo_el_dia': 'S',
              'fecha_inicio': (app.fn.es_nulo(t.fecha_inicio) ? t.fecha_entrega : t.fecha_inicio),
              'fecha_fin': t.fecha_entrega,
              'observaciones': t.descripcion,
              'color': v_color.alt,
              'color_fondo': v_color.color,
              'color_borde': v_color.color
            });

            app._entradas.push(v_ev);

          };

        };

      };

    };

    app.calendario_movilidad.limpiar_eventos_calendario();
    app.calendario_movilidad.crear_eventos_calendario(app._entradas);

    setTimeout(function(){ app.calendario_movilidad.refrescar_visualizacion_entradas(); }, 250);

  };

  app.fn.plantilla_evento_calendario = function(schedule, isAllDay) {

    var v_html = ['<div class="menu-contextual-tarea" data-tarea="' + schedule.id + '">'];

    var t = app.fn.buscar_por_id(app._tareas, 'codigo', schedule.id);

    if(t.usuario_responsable != '') v_html.push( app.fn._get_avatar_usuario({'usuario': t.usuario_responsable, 'clase': 'avatar-s mr1'}) );

    if(t.tarea_padre != '') v_html.push('<div class="icono"><span class="icon icon-code-branch icon-rotate-90"></span></div>');

    v_html.push('<span class="titulo-evento-calendario">' + schedule.title + '</span>');

    if(t.etiquetas.length > 0) {
      v_html.push('<ul class="wrapper-tarea-etiquetas">');
      for(var i in t.etiquetas) {
        var e = app.fn.buscar_por_id(app._etiquetas, 'codigo', t.etiquetas[i]);
        v_html.push('<li class="etiqueta-' + t.codigo + ((e.color != '') ? ' color_libra_' + e.color + '_bg' : '') +  '" title="' + e.nombre + '"></li>');
        if(i > 2) break;
      };
      v_html.push('</ul>');
    };
    v_html.push('</div>');
    
    return v_html.join(' ');
    
  };

  app.fn.pulsar_entrada_calendario = function(ev) {

    var t = app.fn.buscar_por_id(app._tareas, 'codigo', ev.schedule.id);
    if(t != null) app.fn.mostrar_detalle_tarea({'tarea': t});

  };

  app.fn.pre_crear_entrada_calendario = function(ev) {
  
    if(app.tarea_actual != null) app.fn.ocultar_detalle_tarea();

    ev.guide.clearGuideElement();
    return false;

  };

  app.fn.modificar_fechas_entrada = function(ev) {

    if(ev.changes != null) {

      var i = app.fn.buscar_index_por_id(app._tareas, 'codigo', ev.schedule.id);

      if(i >= 0) {

        if(typeof ev.changes.start != 'undefined' && ev.schedule.start != ev.changes.start) {
          
          v_fecha_inicio = ev.changes.fecha_inicio;
          v_fecha_fin = ev.changes.fecha_fin;

          app.calendario_movilidad.actualizar_evento_calendario({'id_evento': ev.schedule.id, 'id_calendario': ev.schedule.calendarId, 'cambios': ev.changes});

          if((app.fn.es_nulo(app._tareas[i]['fecha_inicio']) || app._tareas[i]['fecha_inicio'] === app._tareas[i]['fecha_entrega']) & v_fecha_inicio === v_fecha_fin) {
            
            app.fn.upd_tarea({
              'tarea': app._tareas[i],
              'campo': 'FECHA_ENTREGA',
              'valor': v_fecha_inicio
            });

          } else {

            app.fn.upd_tarea({
              'tarea': app._tareas[i],
              'campo': 'FECHA_INICIO',
              'valor': v_fecha_inicio
            });

            app.fn.upd_tarea({
              'tarea': app._tareas[i],
              'campo': 'FECHA_ENTREGA',
              'valor': v_fecha_fin
            });

          };
          
        };

      };

    };

  };

  app.fn.cambiar_fecha_vista_calendario = function() {

    app._vista_calendario = app.calendario_movilidad.get_vista_actual_calendario();
    app._fecha_calendario = app.calendario_movilidad.get_fecha_actual_calendario();

  };

  app.fn.limpiar_dom_panel = function() {

    app.tpl.gtd.menu_logo.removeClass('secundario').find('button').removeClass().html('').removeAttr('style').addClass('btn-logo');
    app.tpl.gtd.menu_header.empty().append( app.fn.generar_loader({numero_lineas: 1}) );
    app.tpl.gtd.menu_tabs.find('button').hide();

    app.fn._set_titulo_filtro_status_tarea();
    
    app.fn.limpiar_dom_proyecto();

  };

  app.fn.limpiar_dom_proyecto = function() {

    if(app.vista_actual != null) {

      switch (app.vista_actual) {
        case 'lista':
        case 'tablero':
          app.fn.pintar_tareas();
          break;
      
        default:
          break;
      };

    };

  };

  app.fn.mostrar_alta_proyecto = function () {

    app.fn.desactivar_timeout();

    app.fn.activar_region(app.tpl.region.r_alta_proyecto, {
      modal: true,
      opciones_modal: {
        flex: true,
        css: 'width:50rem;max-width:75%',
        callback: function(){ app.fn.activar_timeout(); }
      },
      cerrable: true,
      callback: function () {

        app.fn.generar_bloque('alta_proyecto', app.tpl.region.r_alta_proyecto, {}, function () {

          var v_btn_alta = app.fn.genera_boton('btn-alta-proyecto', 'btngris', app.opts.lang.grabar, function () {

            if(!app.fn.validar_formulario(app.tpl.region.r_alta_proyecto)) return false;
            var v_proyecto = app.fn.obtener_valores_form(app.tpl.region.r_alta_proyecto);

            app.fn.ins_proyecto(v_proyecto);

          });

          app.tpl.region.r_alta_proyecto.find('.button-contain').append(v_btn_alta);

        });

      }
    });

  };

  app.fn.mostrar_gestion_campo = function (p_parametros) {

    var v_bloque = p_parametros.bloque;

    app.fn.activar_region(app.tpl.region.r_gestion_campo, {
      modal: true,
      opciones_modal: {
        flex: true,
        css: 'width:50rem;max-width:75%',
        callback: function(){ app.fn.activar_timeout(); }
      },
      cerrable: true,
      callback: function () {

        for(var i in app.erp[v_bloque]) {
          app.erp[v_bloque][i].ocultar = (i === 'p_' + p_parametros.campo) ? 'N' : 'S';
          app.erp[v_bloque][i].valor_por_defecto = p_parametros.objeto[i.replace('p_', '')];
          if(i === 'p_color') app.erp[v_bloque][i].valor_por_defecto = app.erp[v_bloque][i].valor_por_defecto.toUpperCase();
        };

        app.fn.generar_bloque(v_bloque, app.tpl.region.r_gestion_campo, {
        }, function () {

          var v_btn_actualizar = app.fn.genera_boton('btn-upd-campo', 'btnverde', app.opts.lang.grabar, function () {

            if(!app.fn.validar_formulario(app.tpl.region.r_gestion_campo)) return false;
            var v_datos = app.fn.obtener_valores_form(app.tpl.region.r_gestion_campo);

            if(v_bloque === 'seccion') {

              app.fn.upd_seccion({
                'seccion': p_parametros.objeto,
                'campo': p_parametros.campo.toUpperCase(),
                'valor': v_datos['p_' + p_parametros.campo]
              });

            } else {

              app.fn.upd_etiqueta({
                'etiqueta': p_parametros.objeto,
                'campo': p_parametros.campo.toUpperCase(),
                'valor': v_datos['p_' + p_parametros.campo]
              });

            };

          });

          app.tpl.region.r_gestion_campo.find('.button-contain').append(v_btn_actualizar);

        });

      }
    });

  };

  app.fn.mostrar_gestion_campo_aux = function (p_parametros) {

    if(typeof p_parametros.valores === 'undefined') p_parametros.valores = [];

    app.fn.activar_region(app.tpl.region.r_gestion_campo, {
      modal: true,
      opciones_modal: {
        flex: true,
        panel_lateral: true,
        ampliable: false
      },
      titulo: app.opts.lang.campo_auxiliar,
      cerrable: true,
      callback: function () {

        for(var i in app.erp.campo_aux) {
          app.erp.campo_aux[i].valor_por_defecto = p_parametros[i.replace('p_', '')];
        };
        app.erp.campo_aux.p_tipo.desactivar_modificacion = (p_parametros.codigo != '') ? 'S' : 'N';
        app.erp.campo_aux.p_lista_valores.desactivar_modificacion = (p_parametros.codigo != '') ? 'S' : 'N';
        app.erp.campo_aux.p_lista_valores.ocultar = (p_parametros.tipo != 'L') ? 'S' : 'N';

        app.fn.generar_bloque('campo_aux', app.tpl.region.r_gestion_campo, {
        }, function () {

          var v_html = [];
          v_html.push('<ul class="sortable-panel sortable-panel-valores' + ((p_parametros.tipo !== 'S') ? ' oculto' : '') + '">');
          for(var c in p_parametros.valores) {
            
            var v_valor = p_parametros.valores[c];
            v_valor.color = (typeof v_valor.color != 'undefined') ? v_valor.color.toLowerCase() : '';

            v_html.push('<li class="elem-valor-campo-aux" data-codigo="' + v_valor.codigo + '">');
            v_html.push('<span class="btn-handle"><svg class="drag-icon" focusable="false" viewBox="0 0 24 24"><path d="M10,4c0,1.1-0.9,2-2,2S6,5.1,6,4s0.9-2,2-2S10,2.9,10,4z M16,2c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,2,16,2z M8,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,10,8,10z M16,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,10,16,10z M8,18 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,18,8,18z M16,18c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,18,16,18z"></path></svg></span>');
            v_html.push('<button class="btn-color-valor' + ((v_valor.color != '') ? ' color_libra_' + v_valor.color + '_bg' : '') + '" data-color="' + v_valor.color + '"></button><div class="field d100"><input class="input-dinamico" type="text" maxlength="500" value="' + v_valor.valor + '" /></div><button class="btn-simple btn-hover btn-eliminar-valor"><span class="icon icon-times"></span></button>');
            v_html.push('</li>');

          };
          v_html.push('<li class="elem-valor-campo-aux elem-nuevo-campo"><button class="btn-nuevo-campo"><span class="icon icon-plus"></span>' + app.opts.lang.btn_nuevo_valor + '</button></li></ul>');

          app.tpl.region.r_gestion_campo.find('.field-contain').after( v_html.join('') );

          app.sortable.valores = sortable('.sortable-panel-valores', {
            forcePlaceholderSize: true,
            handle: '.btn-handle',
            items: '.elem-valor-campo-aux:not(.elem-nuevo-campo)',
            placeholder: '<li class="elem-valor-campo-aux elem-campo-placeholder"></li>'
          });
      
          $('.sortable-panel-valores').off('sortstart').on('sortstart', function(e) {
            app.fn.desactivar_timeout();
          }).off('sortstop').on('sortstop', function(e) {
            app.fn.activar_timeout();
          });

          var v_btn_wrapper = app.tpl.region.r_gestion_campo.find('.button-contain');

          if(p_parametros.codigo != '') {

            var v_btn_eliminar = app.fn.genera_boton('btn-del-campo-aux', 'btnrojo', app.opts.lang.eliminar, function () {

              msg.ask(app.opts.lang.msg_eliminar_campo_aux, function(val) {
                if(val === 'Y') {
                  app.fn.del_campo_aux({'codigo': p_parametros.codigo, 'tipo_despliegue': p_parametros.tipo_despliegue});
                };
              }, {'title': app.opts.lang.borrar, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});

            }).appendTo(v_btn_wrapper);

          };

          var v_btn_actualizar = app.fn.genera_boton('btn-upd-campo-aux', 'btnverde', app.opts.lang.grabar, function () {

            if(!app.fn.validar_formulario(app.tpl.region.r_gestion_campo)) return false;
            var v_datos = app.fn.obtener_valores_form(app.tpl.region.r_gestion_campo);
            v_datos.p_valores = [];

            if(v_datos.p_tipo === 'S') {
              var $lis = app.tpl.region.r_gestion_campo.find('.elem-valor-campo-aux:not(.elem-nuevo-campo)');
              $lis.each(function( index ) {
                var $el = $(this);
                var v_item = {};
                v_item.codigo = ($el.data('codigo') || '');
                v_item.valor = $el.find('.input-dinamico').val();
                v_item.color = ($el.find('.btn-color-valor').data('color') || '');
                v_item.orden = index;
                if(app.fn.es_nulo(v_item.valor)) {
                  msg.alert(app.opts.lang.msg_valor_campo_null, null, {btnText: app.opts.lang.aceptar, title: app.opts.lang.error});
                  return;
                };
                v_datos.p_valores.push(v_item);
              });
            };

            v_datos.p_valores = JSON.stringify({'valores': v_datos.p_valores});

            app.fn.set_campo_aux(v_datos);

          }).appendTo(v_btn_wrapper);

          // eventos

          app.tpl.region.r_gestion_campo.find('#p_tipo').on('change', function(e){
            var v_tipo = app.fn.valor('#p_tipo');
            app.tpl.region.r_gestion_campo.find('.sortable-panel-valores').toggle( (v_tipo === 'S') );
            var v_es_lista = ((v_tipo === 'L') ? 'S' : 'N');
            app.fn.erp_campo_update({'p_lista_valores': {'visible': v_es_lista, 'obligatorio': v_es_lista}}, {bloque: 'campo_aux'});
          });

          app.tpl.region.r_gestion_campo.off('click', '.btn-color-valor').on('click', '.btn-color-valor', function(e) {

            app._btn_color_valor = $(this);
            
            app.fn.erp_lanzar_lv({'selector_color': true,'callback': function(p_valor){
              p_valor = (p_valor === 'X') ? '' : p_valor.toLowerCase();
              app._btn_color_valor.removeClass().addClass('btn-color-valor' + ((!app.fn.es_nulo(p_valor)) ? ' color_libra_' + p_valor + '_bg' : '') + '').data('color', p_valor);
            }});

          });

          app.tpl.region.r_gestion_campo.off('click', '.btn-eliminar-valor').on('click', '.btn-eliminar-valor', function(e) {

            var $el = $(this);
            var v_codigo = $el.parent().data('codigo');

            if(!app.fn.es_nulo(v_codigo)) {

              msg.ask(app.opts.lang.msg_eliminar_valor_aux, function(val) {
                if(val === 'Y') $el.parent().remove();
              }, {'title': app.opts.lang.borrar, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});

            } else {
              $el.parent().remove();
            };

          });

          app.tpl.region.r_gestion_campo.find('.btn-nuevo-campo').on('click', function(e) {

            var $el = $(this);

            var v_html = [];
            v_html.push('<li class="elem-valor-campo-aux" data-codigo="">');
            v_html.push('<span class="btn-handle"><svg class="drag-icon" focusable="false" viewBox="0 0 24 24"><path d="M10,4c0,1.1-0.9,2-2,2S6,5.1,6,4s0.9-2,2-2S10,2.9,10,4z M16,2c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,2,16,2z M8,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,10,8,10z M16,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,10,16,10z M8,18 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,18,8,18z M16,18c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,18,16,18z"></path></svg></span>');
            v_html.push('<button class="btn-color-valor"></button><div class="field d100"><input class="input-dinamico" type="text" maxlength="500" /></div><button class="btn-simple btn-hover btn-eliminar-valor"><span class="icon icon-times"></span></button>');
            v_html.push('</li>');
            var $dom = $( v_html.join('') );

            $el.parent().before( $dom );
            $dom.find('.input-dinamico').focus();

            sortable('.sortable-panel-valores', 'reload');

          });

        });

      }
    });

  };

  app.fn.cargar_tarea = function(p_tarea, p_callback, p_error) {

    app.fn.desactivar_timeout();
    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});

    app.fn.anular_peticion_actual();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/tareas', {
      'tarea': p_tarea
    }, function(data) {

      delete app.peticion_actual;
      if(data.resultado === 'OK') {

        app.fn.procesar_tareas(data.tareas, {'limpiar_array': false, 'ocultar_en_lista': true});
        if(typeof p_callback === 'function') p_callback.call();

      } else {

        app.fn.activar_timeout();

        if(typeof p_error === 'function') p_error.call();

      };

      app.fn.loader(false);

    });
    
  };

  app.fn.cargar_gtd = function() {

    app.fn.desactivar_timeout();
    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});

    app.fn.anular_peticion_actual();

    app.filtros.filtro_status_tarea = app.parametros.filtro_status_tarea;

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/gtd', app.fn.unir({
      'proyecto': app.parametros.proyecto,
      'etiqueta': app.parametros.etiqueta,
      'tarea': (app.llamada_directa) ? app.parametros.tarea : ''
    }, app.filtros), function(data) {

      delete app.peticion_actual;
      if(data.resultado === 'OK' && typeof data.gtd != 'undefined') {

        var v_hash = objectHash.sha1(data.gtd);
        if(typeof app._hash_peticion_actual === 'undefined' || app._hash_peticion_actual != v_hash) { 
          
          app._hash_peticion_actual = v_hash;

          app.proyecto_actual = null;
          app.etiqueta_actual = null;

          app.fn.procesar_gtd(data);

        } else {
          app.fn.activar_timeout();
        };

      } else {
        app.fn.activar_timeout();
        if(app.llamada_directa) app.fn.regresar_menu();
      };

      app.tpl.gtd.panel.removeClass('dom-cargando');
      app.fn.loader(false);

    }, function(){

      app.fn.loader(false);
      app.fn.activar_timeout();

      if(app.llamada_directa) app.fn.regresar_menu();

    });

  };

  app.fn.procesar_gtd = function(data) {

    app.permisos = data.gtd.permisos;

    app.fn.procesar_etiquetas(data.gtd.etiquetas);

    app.fn.procesar_tareas(data.gtd.tareas);

    app.fn.procesar_proyectos(data.gtd.proyectos);

    if(!app.llamada_directa) {

      if(app.parametros.etiqueta != '') {

        app.fn.seleccionar_etiqueta(app.parametros.etiqueta);
        
        app.fn.preparar_dom_etiqueta();
        app.fn.cambiar_vista_etiqueta();

      } else if(app.parametros.proyecto != '') {

        app.fn.seleccionar_proyecto(app.parametros.proyecto);

        app.fn.preparar_dom_proyecto();
        app.fn.cambiar_vista_proyecto({'ocultar_tarea_activa': false});

      } else {

        app.fn.preparar_dom_buscador();
        app.fn.cambiar_vista_buscador();

      };

    } else {

      var t = app._tareas[0];

      app.tpl.gtd.menu.hide();
      app.tpl.gtd.filtros.hide();
      app.tpl.gtd.detalle_tarea.removeClass('panel-lateral');

      app.fn.mostrar_detalle_tarea({'tarea': t});

    };

    // buscador usuario responsable en base a permisos
    app.fn.procesar_buscador_usuario_responsable();

    app.fn.activar_timeout();

  };

  app.fn.procesar_buscador_usuario_responsable = function() {

    if(typeof app.permisos.usuarios != 'undefined') {
      
      var v_html = [];
      var v_filtros = [];

      for(var i in app.permisos.usuarios) {
        var c = i.substring(1);
        if(c != app.opts.usuario.usuario) v_filtros.push({'c': c, 'n': app.fn._get_nombre_usuario(c), 't': app.fn._get_num_tareas_usuario(c)});
      };

      v_filtros.sort(function(a, b) { return ((a.n > b.n) ? 1 : -1); });

      for(var i in v_filtros) {
        if( v_filtros[i]['t'] > 0) v_html.push('<li class="sidebar-lista-item' + ((app.filtros.filtro_usuario_responsable === v_filtros[i]['c']) ? ' filtro-activo' : '') + '"><button data-valor="' + v_filtros[i]['c'] + '">' + app.fn._get_avatar_usuario({'usuario': v_filtros[i]['c'], 'clase': 'avatar-s mr1'}) + v_filtros[i]['n'] + '</button></li>');
      };

      v_html.push('</ul>');

      app.tpl.gtd.sidebar.find('.sidebar-buscador').find('.gtd-buscador-usuario-responsable > ul').empty().append(v_html.join(''));

    };

  };

  app.fn.procesar_etiquetas = function(p_etiquetas) {
    
    var $el = app.tpl.gtd.sidebar.find('.sidebar-etiquetas').find('.sidebar-lista').empty();
    var v_html = [];

    app._etiquetas = [];

    for(var i in p_etiquetas) {

      var p = new app._etiqueta(p_etiquetas[i]);
      app._etiquetas.push(p);

      v_html.push('<li class="sidebar-lista-item"><button class="etiqueta-'+ p.codigo + '" data-etiqueta="' + p.codigo + '">' + p.icono + '<span>' + p.nombre + '</span></button></li>');

    };

    $el.append( v_html.join('') );

  };

  app.fn.seleccionar_etiqueta = function(p_codigo_etiqueta) {

    if(typeof p_codigo_etiqueta === 'undefined') p_codigo_etiqueta = '';

    var i = 0;
    if(p_codigo_etiqueta != '') {
      i = app.fn.buscar_index_por_id(app._etiquetas, 'codigo', parseInt(p_codigo_etiqueta));
      if(i < 0) i = 0;
    };

    app.etiqueta_actual = app._etiquetas[i];

  };

  app.fn.preparar_dom_etiqueta = function() {

    app.tpl.gtd.menu_logo.addClass('secundario').find('button').removeClass().addClass('btn-logo').html(app.etiqueta_actual.icono);

    app.tpl.gtd.menu_header.empty().append( '<h2 class="etiqueta-nombre">' + app.etiqueta_actual.nombre + '</h2>' );

    app.tpl.gtd.menu_tabs.find('#vista-resumen').hide();

    app.tpl.gtd.menu_tabs.find('button').show();

  };

  app.fn.preparar_dom_buscador = function() {

    var v_tareas_asignadas = (!app.fn.es_nulo(app.filtros.filtro_usuario_responsable) && app.filtros.filtro_usuario_responsable === app.opts.usuario.usuario);
    
    var v_modo =  {
      'titulo': (!v_tareas_asignadas) ? app.opts.lang.buscador : app.opts.lang.tareas_asignadas,
      'icono': (!v_tareas_asignadas) ? 'search' : 'user'
    };

    app.tpl.gtd.menu_logo.addClass('secundario').find('button').removeClass().addClass('btn-logo-buscador').html('<span class="icon icon-' + v_modo.icono + '"></span>');

    app.tpl.gtd.menu_header.empty().append( '<h2 class="buscador-nombre">' + v_modo.titulo + '</h2>' );

    app.tpl.gtd.menu_tabs.find('#vista-resumen').hide();

    app.tpl.gtd.menu_tabs.find('button').show();

  };

  app.fn.procesar_proyectos = function(p_proyectos) {
    
    var $el = app.tpl.gtd.sidebar.find('.sidebar-proyectos').find('.sidebar-lista').empty();
    var v_html = [];

    app._proyectos = [];

    for(var i in p_proyectos) {

      var p = new app._proyecto(p_proyectos[i]);
      app._proyectos.push(p);

      if(p.tipo != 'U') {
        v_html.push('<li class="sidebar-lista-item"><button id="sbpr-' + p.codigo + '" class="status-' + p.status + '" data-proyecto="' + p.codigo + '"><div class="icono"><span class="icon icon-' + p.icono + ' color_libra_' + p.color + '_bg"></span></div><span class="lbl">' + p.nombre + '</span></button></li>');
      } else {
        $('#lbl-menu-mis-tareas').html(p.nombre);
        p._refrescar_color_icono();
      };

    };

    $el.append( v_html.join('') );

  };

  app.fn.seleccionar_proyecto = function(p_codigo_proyecto) {

    if(typeof p_codigo_proyecto === 'undefined') p_codigo_proyecto = '';

    var i = 0;
    if(p_codigo_proyecto != '') {
      i = app.fn.buscar_index_por_id(app._proyectos, 'codigo', parseInt(p_codigo_proyecto));
      if(i < 0) i = 0;
    };

    app.proyecto_actual = app._proyectos[i];

    app.proyecto_actual._recargar_secciones();

  };

  app.fn.preparar_dom_proyecto = function() {

    var v_logo = (app.proyecto_actual.tipo != 'U') ? 'btn-logo' : 'btn-logo-tareas';

    app.tpl.gtd.menu_logo.removeClass('secundario').find('button').removeClass().addClass(v_logo).html('<span class="icon icon-' + app.proyecto_actual.icono + '"></span>').addClass('color_libra_' + app.proyecto_actual.color + '_bg');
    app.tpl.gtd.menu_header.empty().append( '<h2 class="proyecto-nombre">' + app.proyecto_actual.nombre + '</h2><div class="proyecto-contador-tareas"></div>' );

    app.tpl.gtd.menu_tabs.find('#vista-resumen').toggle( (app.proyecto_actual.tipo != 'U') );

    app.tpl.gtd.menu_tabs.find('button').show();

  };

  app.fn.procesar_tareas = function(p_tareas, p_parametros) {

    if(typeof p_parametros === 'undefined') p_parametros = {};
    if(typeof p_parametros.limpiar_array === 'undefined') p_parametros.limpiar_array = true;
    if(typeof p_parametros.ocultar_en_lista === 'undefined') p_parametros.ocultar_en_lista = false;

    if(p_parametros.limpiar_array) app._tareas = [];

    for(var i in p_tareas) {
      
      var t = new app._tarea(p_tareas[i]);
      if(p_parametros.ocultar_en_lista) t._ocultar = 'S';

      app._tareas.push(t);

    };

  };

  app.fn.pintar_tareas = function() {

    app.proyecto_actual.tareas = [];

    for(var i in app._tareas) {
      var t = app._tareas[i];
      if(t.tarea_padre === '' && typeof t.secciones[app.proyecto_actual.codigo] != 'undefined') {
        var v_orden = t.secciones[app.proyecto_actual.codigo]['orden'];
        app.proyecto_actual.tareas.push({'i': parseInt(i), 'orden': v_orden, '_campo_ordenacion': t._get_campo_ordenacion( ((app.agrupacion === '') ? v_orden : parseInt(i)) )});
      };
    };

    // ordenamos el array
    /*if(app.agrupacion === '') {
      app.fn.ordenar_array_sql(app.proyecto_actual.tareas, {"orden":["asc","NUMBER"]});
    } else {
      //TODO: posibilidad de ordenar por lo que quiera el usuario
      app.fn.ordenar_array_sql(app.proyecto_actual.tareas, {"i":["asc","NUMBER"]});
    };*/

    if(app.ordenacion.campo === '') {
      app.fn.ordenar_array_sql(app.proyecto_actual.tareas, {"orden":[app.ordenacion.modo,"NUMBER"]});
    } else {
      app.fn.ordenar_array_sql(app.proyecto_actual.tareas, {"_campo_ordenacion":[app.ordenacion.modo, app.ordenacion.tipo]});
    };

    for(var i in app.proyecto_actual.tareas) {
      var t = app._tareas[app.proyecto_actual.tareas[i]['i']];
      if(app.parametros.filtro_status_tarea === 'T' || t.status === app.parametros.filtro_status_tarea) {

        var s = null;

        if((app.agrupacion != '' && app.agrupacion != 'seccion') || app.ordenacion.ordenar_por_seccion !== 'S') {

          if(app.agrupacion === 'usuario_responsable') {
  
            if(t.usuario_responsable != '') s = app.fn._get_seccion(t.usuario_responsable);
  
          } else if(app.agrupacion === 'fecha_entrega') {
  
            if(t.fecha_entrega != '') s = app.fn._get_seccion(t.fecha_entrega);
  
          } else if(app.agrupacion === 'crm_expediente_linea') {
  
            if(t.crm_numero_expediente != '') s = app.fn._get_seccion(t.crm_numero_expediente.toString());
  
          } else {
  
            if(typeof t.campos_aux[app.proyecto_actual.codigo] != 'undefined' && t.campos_aux[app.proyecto_actual.codigo][app.agrupacion] != '') s = app.fn._get_seccion(t.campos_aux[app.proyecto_actual.codigo][app.agrupacion]);
  
          };
  
          if(s === null || s == '0') s = app.proyecto_actual.secciones[0];
  
        } else {
          s = app.fn._get_seccion(t.secciones[app.proyecto_actual.codigo]['seccion']);
        };
        
        if(s != null) {
          s.$dom.find('.sortable-panel-tareas').append( t._actualizar_dom() );
          if(app.tarea_actual != null && app.tarea_actual.codigo === t.codigo) {
            // forzamos el refresco de la variable
            app.tarea_actual = t;
            app.fn.mostrar_detalle_tarea(t.codigo);
          };
        };

      };
    };

    app.proyecto_actual._refrescar_contador_tareas();

    for(var i in app.proyecto_actual.secciones) {
      var s = app.proyecto_actual.secciones[i];
      s._controlar_limites();
      if(app.proyecto_actual.status !== 900) s.$dom.find('.sortable-panel').append( new app._btn_nueva_tarea({'seccion': s.codigo}) );
    };

    app.fn.preparar_sortable_secciones();

  };

  app.fn.preparar_sortable_secciones = function() {

    if(!app.proyecto_actual.esta_archivado() && app.fn._puede_ordenar_tareas()) {

      app.sortable.tareas = sortable('.sortable-panel-tareas', {
        forcePlaceholderSize: true,
        handle: (app.vista_actual === 'lista') ? '.btn-handle' : undefined,
        connectWith: '.sortable-panel-tareas',
        items: '.elem-tarea',
        placeholder: '<li class="elem-tarea elem-tarea-placeholder"></li>'
      });

    } else {
      app.sortable.tareas = null;
    };

    app.fn.registrar_eventos_tareas();

  };

  app.fn.registrar_eventos_tareas = function() {

    if(app.fn._puede_ordenar_tareas()) {

      $('.sortable-panel-tareas').off('sortstart').on('sortstart', function(e) {
        app.fn.desactivar_timeout();
      }).off('sortstop').on('sortstop', function(e) {
        app.fn.activar_timeout();
      }).off('sortupdate').on('sortupdate', function(e) {
        
        var v_destino = e.detail.destination.container.getAttribute('data-seccion');
        var v_origen = e.detail.origin.container.getAttribute('data-seccion');

        if(app.agrupacion === '' || (v_destino != v_origen)) {

          var t = $(e.detail.item).data('tarea');

          if(!app.fn.es_nulo(t)) {
            t = app.fn._get_tarea(t);

            app.fn.cambiar_seccion_tarea({
              'tarea': t,
              'seccion': v_destino,
              'orden': e.detail.destination.index
            });

          };
          
        };

      });

    };

  };

  app.fn.pintar_subtareas = function(p_parametros) {

    if(typeof p_parametros === 'undefined' || typeof p_parametros.tarea === 'undefined') return;

    var $dom = app.tpl.gtd.detalle_tarea.find('.detalle-tarea-subtareas');
    
    if(p_parametros.tarea.subtareas.length > 0) {

      var v_subtareas = [];

      for(var i in p_parametros.tarea.subtareas) {
        var t = p_parametros.tarea.subtareas[i];
        v_subtareas.push({'i': parseInt(i), 'orden': t.orden});
      };

      // ordenamos el array
      app.fn.ordenar_array_sql(v_subtareas, {"orden":["asc","NUMBER"]});

      for(var i in v_subtareas) {
        var t = app.fn.buscar_por_id(app._tareas, 'codigo', p_parametros.tarea.subtareas[i]['subtarea']);
        if(!app.fn.es_nulo(t)) $dom.find('.sortable-panel-subtareas').append( t._actualizar_dom() );
      };

    };

    p_parametros.tarea._refrescar_progreso_subtareas();

    var v_proyecto = (app.proyecto_actual != null) ?  app.proyecto_actual: p_parametros.tarea._get_proyecto();
    if(v_proyecto.status !== 900) $dom.find('.sortable-panel').append( new app._btn_nueva_tarea({'tarea': p_parametros.tarea.codigo}) );

    app.sortable.subtareas = sortable('.sortable-panel-subtareas', {
      forcePlaceholderSize: true,
      handle: '.btn-handle',
      connectWith: '.sortable-panel-subtareas',
      items: '.elem-tarea',
      placeholder: '<li class="elem-tarea elem-tarea-placeholder"></li>'
    });

    app.fn.registrar_eventos_subtareas();

  };

  app.fn.registrar_eventos_subtareas = function() {

    $('.sortable-panel-subtareas').off('sortstart').on('sortstart', function(e) {
      app.fn.desactivar_timeout();
    }).off('sortstop').on('sortstop', function(e) {
      app.fn.activar_timeout();
    }).off('sortupdate').on('sortupdate', function(e) {

      var t = $(e.detail.item).data('tarea');
      if(!app.fn.es_nulo(t)) {
        t = app.fn._get_tarea(t);
          
        app.fn.upd_subtarea_orden({
          'tarea': t,
          'orden': e.detail.destination.index
        });

      };

    });

  };

  app.fn.mostrar_detalle_tarea = function(p_parametros) {

    if(typeof p_parametros === 'undefined') return;
    if(typeof p_parametros.tarea === 'undefined') return;

    app.tarea_actual = p_parametros.tarea;

    var v_panel_activo = app.tpl.gtd.detalle_tarea.hasClass('panel-activo');

    if(app.vista_actual === 'tablero') app.tpl.gtd.wrapper_tablero.addClass('detalle-visible');

    if(!v_panel_activo) setTimeout(function(){ app.tpl.gtd.detalle_tarea.addClass('panel-activo'); }, 100);

    app.tpl.gtd.proyecto.find('.elem-tarea').removeClass('tarea-seleccionada');

    if(app.tarea_actual.tarea_padre === '' && app.tarea_actual.depende_de_tarea === '') {
      app.fn.preparar_dom_detalle_tarea(p_parametros);
    } else {

      app.fn.controlar_cargar_tarea(app.tarea_actual.tarea_padre, function(){
        app.fn.controlar_cargar_tarea(app.tarea_actual.depende_de_tarea, function(){
          app.fn.preparar_dom_detalle_tarea(p_parametros);
        });
      });

    };

  };

  app.fn.controlar_cargar_tarea = function(p_tarea, p_callback) {

    if(p_tarea != '') {

      var t = app.fn.buscar_por_id(app._tareas, 'codigo', p_tarea);
      if(t === null) {
        app.fn.cargar_tarea(p_tarea, function() {
          if(typeof p_callback === 'function') p_callback.call();
        });
      } else {
        if(typeof p_callback === 'function') p_callback.call();
      };

    } else {
      if(typeof p_callback === 'function') p_callback.call();
    };

  };

  app.fn.preparar_dom_detalle_tarea = function() {

    app.fn.anular_peticion_actual();

    $wrapper = $('<div class="detalle-tarea-wrapper data-tarea"></div>').data('tarea', app.tarea_actual.codigo);

    app.tpl.gtd.detalle_tarea.empty().append( $wrapper );

    app.navs_actuales = app.tpl.nav.find('button').not('.oculto');

    app.tarea_actual._detalle_tarea();

    app.fn.generar_bloque('tarea', app.tpl.gtd.detalle_tarea.find('.detalle-tarea-bloque'), {'valores': {
      't_codigo': app.tarea_actual.codigo
    }, vaciar: false}, function() {

      app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/get_clob_tarea', {'tarea': app.tarea_actual.codigo}, function(data) {

        delete app.peticion_actual;

        if(data.resultado === 'OK' && app.tarea_actual != null) {

          var v_json = JSON.parse(data.datos);
          app.tarea_actual.descripcion = v_json.descripcion;
          if(typeof v_json.documentos != 'undefined') app.tarea_actual.documentos = v_json.documentos;
          if(typeof v_json.comentarios != 'undefined') app.tarea_actual.comentarios = v_json.comentarios;
          if(typeof v_json.historial != 'undefined') app.tarea_actual.historial = v_json.historial;
          if(typeof v_json.historial != 'undefined') app.tarea_actual.expediente = v_json.expediente;

          app.fn.procesar_detalle_tarea();

          app.tarea_actual._actualizar_dom();

        } else {
          app.fn.ocultar_detalle_tarea();
        };

      });

    });

  };

  app.fn.procesar_detalle_tarea = function() {

    // DESCRIPCION
    var $el = $('#tarea-descripcion').val(app.tarea_actual.descripcion);
    $el.parent().find('.text__loading').remove();

    if(app.tarea_actual.modificable) {
        
      app.fn.ejecutar_plugin('richeditor', function() {

        var v_id = 'tarea-descripcion';
        $('#' + v_id).find('.richeditor-textarea').hide();
        if(typeof app._richeditors === 'undefined') app._richeditors = [];
        app._richeditors[v_id] = new app.fn.richeditor();
        app._richeditors[v_id].iniciar(app, {
          'editor': '#' + v_id,
          'opciones_basicas': 'S',
          'eventos': {
            'focus': function(e) {
              app.fn.desactivar_timeout();
            },
            'blur': function(e) {

              var v_val = this.getContent();

              if(app.tarea_actual.descripcion != v_val) {
                app.fn.upd_tarea({
                  'tarea': app.tarea_actual,
                  'campo': 'DESCRIPCION',
                  'valor_clob': v_val
                });
              };

              app.fn.activar_timeout();

            }
          }
        });

      }, 'files/assets/fn/richeditor', app.fn);

    } else {
      var $el = $('#tarea-descripcion').before(app.tarea_actual.descripcion);
      $el.parent().removeClass('textarea').addClass('ql-editor d100');
      $el.remove();
    };

    // DOCUMENTOS

    app.fn.preparar_drop_ficheros({
      'id_elemento': 'tarea-documentos-drop',
      'campos': {
        'tarea': app.tarea_actual.codigo
      },
      'url': app.opts.api + app.opts.modulo + '/ins_tarea_documento',
      'callback': function(data) {

        app.fn.loader(false);

        if (!app.fn.es_nulo(data.resultado) && data.resultado != 'OK') {
          msg.alert(app.opts.lang.error_subir_archivos, null, {btnText: app.opts.lang.aceptar, title: app.opts.lang.error});
        } else {
          app.fn.preparar_dom_detalle_tarea();
        };

      }
    });

    app.fn.refrescar_documentos_tarea();

    // COMENTARIOS
    app.fn.refrescar_comentarios_tarea();

    // HISTORIAL
    app.fn.refrescar_historial_tarea();

    // EXPEDIENTE
    app.fn.refrescar_expediente_tarea();

  };

  app.fn.refrescar_documentos_tarea = function() {

    var v_html_ficheros = [];

    for(var i in app.tarea_actual.documentos) {

      var v_fichero = app.tarea_actual.documentos[i];

      var v_html = app.fn.generar_elemento_fichero({
        'titulo': v_fichero.nombre,
        'token': v_fichero.token,
        'filename': v_fichero.nombre,
        'peso': v_fichero.peso,
        'modo_visualizacion': 'listado',
        'acciones': {'visor': {'visible': true}, 'descarga': {'visible': true}, 'eliminar': {'visible': (app.tarea_actual.modificable)}}
      });

      v_html_ficheros.push('<li class="elem linea lista-mwldoc lista-mwldoc-listado" data-token="' + v_fichero.token + '" data-nombre="' + v_fichero.nombre + '" data-id="' + v_fichero.id + '">' + v_html + '</li>');

    };

    if(v_html_ficheros.length > 0) {
      v_html_ficheros.unshift('<div class="ob_lista lista-mwldoc lista-mwldoc-listado"><ul class="lista lista-mwldoc lista-mwldoc-listado clr">');
      v_html_ficheros.push('</ul></div>');
    };

    $el = app.tpl.gtd.detalle_tarea.find('.tarea-documentos-lista').empty().append( v_html_ficheros.join('') );
    
    $el.off('click').on('click', '.elem.lista-mwldoc', function(e) {
      e.preventDefault();
      var v_data_archivo = $(this).data();
      app.fn.gestionar_callback_fichero({
        'data': {'id': v_data_archivo.id},
        'token': v_data_archivo.token,
        'titulo': v_data_archivo.nombre,
        'filename': v_data_archivo.nombre,
        'evento': e,
        'callbacks': {
          'eliminar': function(p_parametros) {
            msg.ask(app.opts.lang.msg_del_tarea_documento, function(val) {
              if(val === 'Y') {
                app.fn.del_tarea_documento({'tarea': app.tarea_actual.codigo, 'contador': p_parametros.data.id, '$el': $(p_parametros.evento.currentTarget)});
              };
            }, {'title': app.opts.lang.borrar, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});
          }
        }
      });
      return false;
    });

  };

  app.fn.refrescar_comentarios_tarea = function() {

    var v_html = [];

    for(var i in app.tarea_actual.comentarios) {

      var v_comentario = app.tarea_actual.comentarios[i];

      v_html.push('<li id="com-' + v_comentario.codigo + '" class="actividad');
      if(v_comentario.codigo_padre != '') {
        v_html.push(' pl4">');
      } else {
        v_html.push('"><hr />');
      };
      v_html.push('<div class="actividad-contenido">' + app.fn._get_avatar_usuario({'usuario': v_comentario.usuario}) + '<div class="actividad-wrapper ml1"><header><div class="actividad-titulo"><p class="actividad-usuario">' + v_comentario.usuario + '</p><p class="actividad-fecha">' + v_comentario.fecha + '</p></div><div class="actividad-acciones"><button class="btn-actividad-acciones" data-comentario="' + v_comentario.codigo + '" data-usuario="' + v_comentario.usuario + '"><span class="icon icon-ellipsis-v"></span></button></div></header><div class="actividad-texto">' + v_comentario.comentario + '</div></div></div></li>');

    };

    $el = app.tpl.gtd.detalle_tarea.find('.tarea-actividad-lista .lista-actividad');
    $el.find('.blog__loading').remove();
    if(v_html.length > 0) $el.append( v_html.join('') );

    if(app.tarea_actual.status === 'F') {
      $el.append('<li class="actividad actividad-finalizacion"><div class="actividad-contenido">' + app.fn._get_avatar_usuario({'usuario': app.tarea_actual.usuario_finalizacion}) + '<div class="actividad-wrapper mt1 ml1"><header><div class="actividad-titulo"><p class="actividad-usuario">' + app.tarea_actual.usuario_finalizacion + ' ' + app.opts.lang.act_finalizacion_tarea + '</p><p class="actividad-fecha">' + app.tarea_actual.fecha_finalizacion+ '</p></div><div class="actividad-acciones"><span class="icon icon-check-circle"></span></div></header></div></div></li>');
    }


    $el.find('.actividad-acciones').each(function(i) {
      app.fn.preparar_menu_contextual_comentario( $(this) );
    });

  };

  app.fn.refrescar_historial_tarea = function() {

    var v_html = [];

    if( app.tarea_actual.historial.length > 0) {

      var v_fecha_actual = null;

      for(var i in app.tarea_actual.historial) {

        var v_registro = app.tarea_actual.historial[i];

        if(v_fecha_actual === null || v_fecha_actual != v_registro.fecha) {
          if(v_fecha_actual != null) v_html.push('</ul></li>');
          v_html.push('<li class="dia-actividad"><p>' + v_registro.fecha + '</p><ul>');
        };

        v_html.push('<li id="his-' + v_registro.id + '" class="actividad"><div class="actividad-contenido"><div class="actividad-wrapper ml1"><header><div class="actividad-titulo"><p><b>' + v_registro.usuario + '</b> ' + v_registro.html + '</p><p class="actividad-fecha">' + v_registro.hora + '</p></div></header></div></div></li>');

        v_fecha_actual = v_registro.fecha;

      };

      v_html.push('</ul></li>');

      $el = app.tpl.gtd.detalle_tarea.find('.tarea-actividad-lista .lista-historial');
      if(v_html.length > 0) $el.append( '<hr />' + v_html.join('') );

    };

  };

  app.fn.refrescar_expediente_tarea = function() {

    var v_html = '';

    if( !app.fn.esta_vacio(app.tarea_actual.expediente) ) {

      v_html = '<div class="ficha-expediente"><header><p class="tipo">' + app.tarea_actual.expediente.d_tipo_expediente + '</p><p class="explin">' + app.tarea_actual.crm_numero_expediente + ((app.tarea_actual.crm_numero_linea != '') ? '/' + app.tarea_actual.crm_numero_linea : '') + '</p></header><section><p class="p1">' + app.tarea_actual.expediente.d_entidad + '</p><p class="p1">' + app.tarea_actual.expediente.descripcion + '</p></section></div>';

      $el = app.tpl.gtd.detalle_tarea.find('.tarea-expediente');
      if(v_html.length > 0) $el.append( v_html );

    };

  };

  app.fn.preparar_menu_contextual_comentario = function(p_item) {

    if(typeof p_item == 'undefined' || p_item.length === 0) return;

    p_item.contextMenu({
      selector: '.btn-actividad-acciones',
      className: 'btn-actividad-acciones-visible',
      trigger: 'left',
      build: function ($trigger, e) {
        e.preventDefault();

        var v_comentario = $trigger.data('comentario');
        var v_usuario = $trigger.data('usuario');
        
        var v_items = {};

        v_items.responder = {
          name: '<span class="icon icon-reply mr1"></span>' + app.opts.lang.responder,
          isHtmlName: true
        };

        if (v_usuario === app.opts.usuario.usuario) {

          v_items.editar = {
            name: '<span class="icon icon-edit mr1"></span>' + app.opts.lang.editar,
            isHtmlName: true
          };

          v_items.eliminar = {
            name: '<span class="icon icon-trash mr1"></span>' + app.opts.lang.eliminar,
            isHtmlName: true,
            className: 'color_libra_rojo'
          };

        };

        if(app.fn.esta_vacio(v_items)) return false;

        return {
          callback: function (key, options) {

            var $el = $trigger.closest('.actividad');
            var v_comentario = $trigger.data('comentario');
            var v_usuario = $trigger.data('usuario');

            if (key === 'responder') {

              app.fn.escribir_comentario({'tarea': app.tarea_actual.codigo, 'codigo_padre': v_comentario, 'usuario': v_usuario});

            } else if (key === 'editar') {

              app.fn.escribir_comentario({'tarea': app.tarea_actual.codigo, 'codigo': v_comentario});

            } else if (key === 'eliminar') {

              msg.ask(app.opts.lang.msg_del_tarea_comentario, function (val) {
                if (val === 'Y') app.fn.del_tarea_comentario({'comentario': v_comentario, '$el': $el});
              }, {
                btnYesText: app.opts.lang.aceptar,
                btnNoText: app.opts.lang.cancelar,
                title: app.opts.lang.aviso
              });
            };

          },
          items: v_items
        };
      }
    });

  };

  app.fn.escribir_comentario = function(p_parametros) {

    if(typeof p_parametros.codigo === 'undefined') p_parametros.codigo= '';
    if(typeof p_parametros.codigo_padre === 'undefined') p_parametros.codigo_padre = '';
    if(typeof p_parametros.usuario === 'undefined') p_parametros.usuario = '';

    app.comentario_actual = p_parametros;

    app.fn.cerrar_escritura_comentario();

    app.tpl.wrapper_respuesta = app.tpl.gtd.detalle_tarea.find('.comentarios-wrapper-responder').find('.respuesta');

    var v_texto = '';
    if(app.comentario_actual.codigo != '') {
      var v_com = app.fn.buscar_por_id(app.tarea_actual.comentarios, 'codigo', app.comentario_actual.codigo);
      v_texto = v_com.comentario;
    };
    app.tpl.wrapper_escritura = $('<div class="wrapper-escritura"><div class="comentario-texto">' + v_texto + '</div></div>').appendTo(app.tpl.wrapper_respuesta);

    app.tpl.wrapper_respuesta.find('.editable').hide();

    if(app.comentario_actual.codigo_padre != '' && app.comentario_actual.usuario !== '') {
      app.tpl.wrapper_escritura.prepend('<span class="ref-usuario" data-usuario="' + app.comentario_actual.usuario + '" alt="' + app.comentario_actual.usuario + '">@' + app.comentario_actual.usuario + '</span>');
    };

    $el = app.tpl.gtd.detalle_tarea.find('.detalle-tarea-article');
    $el.prepend('<div class="bloqueador" style="cursor:unset;background:ghostwhite;height:' + $el.prop('scrollHeight') + 'px"></div>');

    app.editor_comentario = new app.fn.richeditor();
    app.editor_comentario.iniciar(app, {
      'editor': app.tpl.wrapper_escritura.find('.comentario-texto')[0],
      'opciones_basicas': true,
      'alto_maximo': '10rem'
    });
    
    setTimeout(function() {
      if(app.comentario_actual.codigo_padre != '') {
        var $el = app.tpl.gtd.detalle_tarea.find('.detalle-tarea-article');
        var v_top = $('#com-' + app.comentario_actual.codigo_padre).offset().top;
        $el.animate({ scrollTop: v_top}, 1000);
      };
      app.editor_comentario.focus();
    }, 250);

    var v_btn_cancelar = $('<button class="cancelar-comentario">' + app.opts.lang.cancelar + '</button>').off().on('click', function(e){
      
      e.preventDefault();
      app.fn.cerrar_escritura_comentario();
      return false;

    }).appendTo(app.tpl.wrapper_escritura);

    var v_btn_publicar = $('<button class="publicar-comentario btnverde">' + app.opts.lang.publicar + '</button>').off().on('click', function(e){

      e.preventDefault();
      
      app.comentario_actual.comentario = app.editor_comentario.getContent();
      
      // eliminamos saltos de linea al comienzo y final
      app.comentario_actual.comentario = app.comentario_actual.comentario.replace(/<p><br[\/]?><[\/]?p>/g, '');
      app.comentario_actual.comentario = app.comentario_actual.comentario.replace(/^(<br[\/]>)+|(<br[\/]>)+$/g, '');

      if(app.comentario_actual.comentario.length > 0) {

        app.tpl.wrapper_respuesta.find('button').hide();
        app.tpl.wrapper_respuesta.find('.editable').show();
        app.tpl.wrapper_respuesta.find('.comentario-wrapper').find('.ref-usuario').remove();
        app.fn.cerrar_escritura_comentario();
        app.tpl.wrapper_escritura.remove();

        app.fn.ins_tarea_comentario(app.comentario_actual);

      };

      return false;

    }).appendTo(app.tpl.wrapper_escritura);

  };

  app.fn.cerrar_escritura_comentario = function() {

    if(typeof app.tpl.wrapper_escritura != 'undefined' && app.tpl.wrapper_escritura.length > 0) {

      app.tpl.wrapper_escritura.find('.comentario-wrapper').find('.ref-usuario').remove();
      
      app.tpl.wrapper_escritura.find('.comentario-acciones').show();
      app.tpl.wrapper_escritura.find('.comentario-texto').html(app.texto_comentario);
      delete app.texto_comentario;

      if(typeof app.editor_comentario != 'undefined') app.editor_comentario.destroy();
      delete app.editor_comentario;
      
      app.tpl.wrapper_respuesta.find('.editable').show();
      
      app.tpl.wrapper_escritura.remove();

      app.tpl.gtd.detalle_tarea.find('.detalle-tarea-article .bloqueador').remove();

    };
    
  };

  app.fn.ocultar_detalle_tarea = function() {

    if(app.vista_actual === 'tablero') app.tpl.gtd.wrapper_tablero.removeClass('detalle-visible');

    app.tpl.gtd.proyecto.find('.elem-tarea.tarea-seleccionada').removeClass('tarea-seleccionada');

    app.tpl.gtd.detalle_tarea.removeClass('panel-activo').empty();
    app.tarea_actual = null;

  };

  app.fn.ins_proyecto = function(p_parametros) {

    app.fn.loader(true);

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/ins_proyecto', p_parametros, function(data) {

      delete app.peticion_actual;
      app.fn.loader(false);

      if(data.resultado === 'OK') {

        app.fn.desactivar_region_modal(app.tpl.region.r_alta_proyecto);

        app.parametros.proyecto = data.codigo;
        app._buscador_permisos.permisos = [];
        app.fn.procesar_gtd(data);

      };

    });

  };

  app.fn.upd_proyecto = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    if(typeof p_parametros.valor === 'undefined') p_parametros.valor = '';
    if(typeof p_parametros.valor_clob === 'undefined') p_parametros.valor_clob = '';

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_proyecto', {'proyecto': app.proyecto_actual.codigo, 'campo': p_parametros.campo, 'valor': p_parametros.valor, 'valor_clob': p_parametros.valor_clob}, function(data) {

      delete app.peticion_actual;
      app.fn.loader(false);

      if(p_parametros.campo != 'STATUS') {
        app.proyecto_actual._actualizar_campo(p_parametros);
      } else {
        app.fn.cargar_gtd();
      };

    });

  };

  app.fn.del_proyecto = function() {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_proyecto', {'proyecto': app.proyecto_actual.codigo}, function(data) {

      delete app.peticion_actual;
      app.fn.loader(false);

      if(data.resultado === 'OK') {
        var el = app.fn.buscar_por_id(app._proyectos, 'tipo', 'U');
        app.fn.cambiar_proyecto(el);
      };

    });

  };

  app.fn.upd_seccion = function(p_parametros) {
    
    var c = p_parametros.seccion;
    var v_recargar = (['ORDEN','OBSERVACIONES'].indexOf(p_parametros.campo) > -1);

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});

    if(v_recargar) app.fn.desactivar_timeout();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_seccion', {
      'codigo': c.codigo,
      'proyecto': app.proyecto_actual.codigo,
      'campo': p_parametros.campo,
      'valor': p_parametros.valor,
      'recargar': (v_recargar) ? 'S' : 'N'
    }, function(data){

      delete app.peticion_actual;
      app.fn.loader(false);

      app.fn.desactivar_region_modal(app.tpl.region.r_gestion_campo);

      if(!v_recargar) {
        c._actualizar_campo(p_parametros);
      } else {
        app.fn.procesar_gtd(data);
      };

    });

  };

  app.fn.upd_tarea = function(p_parametros) {

    var t = p_parametros.tarea;
    var v_recargar = (['ORDEN'].indexOf(p_parametros.campo) > -1 && app.etiqueta_actual === null);
    if(app.agrupacion === p_parametros.campo.toLowerCase()) v_recargar = true;

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    if(typeof t.$dom != 'undefined') t.$dom.addClass('dom-cargando');

    if(v_recargar) app.fn.desactivar_timeout();

    if(typeof p_parametros.valor === 'undefined') p_parametros.valor = '';
    if(typeof p_parametros.valor_clob === 'undefined') p_parametros.valor_clob = '';

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_tarea', {
      'codigo': t.codigo,
      'proyecto': ((app.proyecto_actual != null) ? app.proyecto_actual.codigo : ''),
      'campo': p_parametros.campo,
      'valor': p_parametros.valor,
      'valor_clob': p_parametros.valor_clob,
      'recargar': (v_recargar) ? 'S' : 'N'
    }, function(data) {

      delete app.peticion_actual;
      app.fn.loader(false);
      if(typeof t.$dom != 'undefined') t.$dom.removeClass('dom-cargando');

      if(!v_recargar) {

        if(p_parametros.campo === 'USUARIO_RESPONSABLE' && typeof data.permisos != 'undefined') app.permisos = data.permisos;

        // forzamos la recarga de la variable de la tarea actual, por si ha cambiado
        if(app.tarea_actual != null && app.tarea_actual.codigo === t.codigo) app.tarea_actual = t = app.fn.buscar_por_id(app._tareas, 'codigo', t.codigo);
        t._actualizar_campo(p_parametros);
        if(app.proyecto_actual != null) app.proyecto_actual._refrescar_contador_tareas();

        if(app.parametros.proyecto === '' && app.parametros.etiqueta === '') {
          app.fn.vista_tareas_buscador();
          if(app.tarea_actual != null) app.fn.mostrar_detalle_tarea({'tarea': app.tarea_actual});
        };

        app.fn.activar_timeout();

      } else {
        app.fn.procesar_gtd(data);
      };

    });

  };

  app.fn.cambiar_status_tarea = function(p_parametros) {

    if(typeof p_parametros === 'undefined' || typeof p_parametros.tarea === 'undefined') return;
    if(typeof p_parametros.modo === 'undefined' || p_parametros.modo === '') p_parametros.modo =  (p_parametros.tarea.status != 'F') ? 'F' : 'P';

    app.fn.upd_tarea({
      'tarea': p_parametros.tarea,
      'campo': 'STATUS',
      'valor': p_parametros.modo
    });

  };

  app.fn.cambiar_seccion_tarea = function(p_parametros) {

    if(typeof p_parametros === 'undefined' || typeof p_parametros.tarea === 'undefined' || typeof p_parametros.seccion === 'undefined') return;
    if(typeof p_parametros.orden === 'undefined') p_parametros.orden = '';

    if(typeof p_parametros.tarea != 'object') p_parametros.tarea = app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(p_parametros.tarea));

    if(app.agrupacion === '') {

      if(p_parametros.tarea.tarea_padre != '') {
        msg.ask(app.opts.lang.msg_mover_subtarea, function(val) {
          if(val === 'Y') {
            app.fn.upd_tarea_seccion({
              'tarea': p_parametros.tarea,
              'seccion': parseInt(p_parametros.seccion),
              'orden': p_parametros.orden
            });
          };
        }, {'title': app.opts.lang.pregunta, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});
      } else {
        app.fn.upd_tarea_seccion({
          'tarea': p_parametros.tarea,
          'seccion': parseInt(p_parametros.seccion),
          'orden': p_parametros.orden
        });
      };

    } else {

      if(app.agrupacion === 'usuario_responsable') {

        app.fn.upd_tarea({
          'tarea': p_parametros.tarea,
          'campo': 'USUARIO_RESPONSABLE',
          'valor': p_parametros.seccion
        });

      } else if(app.agrupacion === 'fecha_entrega') {

        app.fn.upd_tarea({
          'tarea': p_parametros.tarea,
          'campo': 'FECHA_ENTREGA',
          'valor': p_parametros.seccion
        });

      } else if(app.agrupacion === 'crm_expediente_linea') {

        app.fn.upd_tarea({
          'tarea': p_parametros.tarea,
          'campo': 'CRM_EXPEDIENTE_LINEA',
          'valor': p_parametros.seccion
        });

      } else {

        app.fn.set_tarea_campo_aux({
          'tarea': p_parametros.tarea.codigo,
          'campo': app.agrupacion,
          'valor': (p_parametros.seccion != 'NULL') ? p_parametros.seccion : null
        });

      }

    };

  };

  app.fn.asignar_dependencia = function(p_parametros) {
    
    if(typeof p_parametros === 'undefined' || typeof p_parametros.tarea === 'undefined') return;

    if(typeof p_parametros.tarea != 'object') p_parametros.tarea = app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(p_parametros.tarea));

    app.fn.desactivar_timeout();
    
    app.fn.activar_region(app.tpl.region.aux_plugin, {
      modal: true,
      opciones_modal: {
        flex: true,
        css: 'width:50rem;max-width:75%',
        callback: function(){ app.fn.activar_timeout(); }
      },
      titulo: app.opts.lang.asignar_dependencia,
      cerrable: true,
      callback: function () {

        app._buscador_tareas.iniciar({
          tarea: p_parametros.tarea,
          callback: function() {
            app.fn.desactivar_region_modal(app.tpl.region.aux_plugin);
            app.fn.upd_tarea({
              'tarea': p_parametros.tarea,
              'campo': 'DEPENDE_DE_TAREA',
              'valor': app._buscador_tareas.tarea_seleccionada
            });
          }
        }); 

      }});

  };

  app.fn.eliminar_dependencia = function(p_parametros) {
    
    if(typeof p_parametros === 'undefined' || typeof p_parametros.tarea === 'undefined') return;

    if(typeof p_parametros.tarea != 'object') p_parametros.tarea = app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(p_parametros.tarea));

    app.fn.upd_tarea({
      'tarea': p_parametros.tarea,
      'campo': 'DEPENDE_DE_TAREA',
      'valor': ''
    });
    
  };

  app.fn.asignar_permiso = function() {

    app.fn.desactivar_timeout();
    
    app.fn.activar_region(app.tpl.region.aux_plugin, {
      modal: true,
      opciones_modal: {
        flex: true,
        css: 'width:50rem;max-width:75%',
        callback: function(){ app.fn.activar_timeout(); }
      },
      titulo: app.opts.lang.asignar_permiso,
      cerrable: true,
      callback: function () {

        app._buscador_permisos.iniciar({
          callback: function() {
            app.fn.desactivar_region_modal(app.tpl.region.aux_plugin);
            app.fn.activar_timeout();
            if(!app.fn.esta_vacio(app._buscador_permisos.permiso_seleccionado)) app.fn.set_proyecto_permiso(app._buscador_permisos.permiso_seleccionado);
          }
        }); 

      }});

  };

  app.fn.asignar_expediente = function(p_parametros) {
    
    if(typeof p_parametros === 'undefined' || typeof p_parametros.tarea === 'undefined') return;

    if(typeof p_parametros.tarea != 'object') p_parametros.tarea = app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(p_parametros.tarea));

    app.fn.desactivar_timeout();
    
    app.fn.activar_region(app.tpl.region.aux_plugin, {
      modal: true,
      opciones_modal: {
        flex: true,
        css: 'width:50rem;max-width:75%',
        callback: function(){ app.fn.activar_timeout(); }
      },
      titulo: app.opts.lang.asignar_expediente,
      cerrable: true,
      callback: function () {

        app._buscador_expedientes.iniciar({
          tarea: p_parametros.tarea,
          callback: function() {
            app.fn.desactivar_region_modal(app.tpl.region.aux_plugin);
            app.fn.upd_tarea({
              'tarea': p_parametros.tarea,
              'campo': 'CRM_EXPEDIENTE_LINEA',
              'valor': app._buscador_expedientes.linea_seleccionada
            });
          }
        }); 

      }});

  };

  app.fn.desvincular_expediente = function(p_parametros) {
    
    if(typeof p_parametros === 'undefined' || typeof p_parametros.tarea === 'undefined') return;

    if(typeof p_parametros.tarea != 'object') p_parametros.tarea = app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(p_parametros.tarea));

    app.fn.upd_tarea({
      'tarea': p_parametros.tarea,
      'campo': 'CRM_EXPEDIENTE_LINEA',
      'valor': ''
    });
    
  };

  app.fn.confirmar_del_seccion = function(p_parametros) {

    p_parametros.$el.closest('.seccion-proyecto').addClass('opacidad-media');
    
    msg.ask(app.opts.lang.msg_del_seccion, function(val) {
      if(val === 'Y') {
        app.fn.del_seccion(p_parametros);
      } else {
        p_parametros.$el.closest('.seccion-proyecto').removeClass('opacidad-media');
      };
    }, {'title': app.opts.lang.borrar, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});
    
  };

  app.fn.del_seccion = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_seccion', {
      'codigo': p_parametros.seccion.codigo,
      'proyecto': app.proyecto_actual.codigo,
      'seccion_mover_tareas': 0
    }, function(data){

      delete app.peticion_actual;
      app.fn.loader(false);
      app.fn.procesar_gtd(data);

    });

  };

  app.fn.confirmar_del_tarea = function(p_parametros) {

    var v_mensaje = (p_parametros.tarea.subtareas.length === 0) ? app.opts.lang.msg_del_tarea : app.opts.lang.msg_del_tarea_y_subtareas;
    
    msg.ask(v_mensaje, function(val) {
      if(val === 'Y') app.fn.del_tarea({'tarea': p_parametros.tarea, '$el': p_parametros.$el});
    }, {'title': app.opts.lang.borrar, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar});
 
  };

  app.fn.del_tarea = function(p_parametros) {

    var t = p_parametros.tarea;

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    p_parametros.tarea.$dom.addClass('dom-cargando');
    app.fn.desactivar_timeout();

    if(typeof p_parametros.$el != 'undefined') p_parametros.$el.addClass('opacidad-media');

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_tarea', {
      'codigo': t.codigo,
      'proyecto': (app.proyecto_actual != null) ? app.proyecto_actual.codigo : ''
    }, function(data) {

      delete app.peticion_actual;
      app.fn.loader(false);
      t.$dom.remove();

      app.fn._actualizar_dependencias_tareas({'tarea_principal': t.codigo, 'borrar_dependencia': true});

      if(app.parametros.proyecto === '' && app.parametros.etiqueta === '') app.fn.vista_tareas_buscador();

      if(t.tarea_padre != '') {

        var p = app.fn.buscar_por_id(app._tareas, 'codigo', t.tarea_padre);
        var s = app.fn.buscar_index_por_id(p.subtareas, 'subtarea', t.codigo);
        p.subtareas.splice(s, 1);

        if(app.tarea_actual != null && app.tarea_actual.codigo === t.codigo) {
          app.fn.mostrar_detalle_tarea({'tarea': app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(t.tarea_padre)) });
        } else if(app.tarea_actual.codigo === t.tarea_padre) {
          p._refrescar_progreso_subtareas();
        } else {
          app.fn.ocultar_detalle_tarea();
        };

        app.fn.activar_timeout();

      } else {
        app.fn.ocultar_detalle_tarea();
        if(app.proyecto_actual != null) app.fn.procesar_gtd(data);
      };

    });

  };

  app.fn.upd_tarea_seccion = function(p_parametros) {

    var c = p_parametros.tarea;

    var v_nuevo = {
      seccion: p_parametros.seccion,
      orden: p_parametros.orden
    };

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    p_parametros.tarea.$dom.addClass('dom-cargando');
    app.fn.desactivar_timeout();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_tarea_seccion', {
      'tarea': c.codigo,
      'proyecto': app.proyecto_actual.codigo,
      'nuevo_orden': v_nuevo.orden,
      'nueva_seccion': v_nuevo.seccion
    }, function(data){

      delete app.peticion_actual;
      app.fn.loader(false);
      p_parametros.tarea.$dom.removeClass('dom-cargando');

      // forzamos la recarga de la variable de la tarea actual, por si ha cambiado
      if(app.tarea_actual != null && app.tarea_actual.codigo === c.codigo) {
        app.tarea_actual = c = app.fn.buscar_por_id(app._tareas, 'codigo', c.codigo);
        c.tarea_padre = '';
        app.fn.mostrar_detalle_tarea({'tarea': c});
      };

      app.fn.procesar_gtd(data);

    });

  };

  app.fn.upd_subtarea_orden = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_subtarea_orden', {
      'tarea': app.tarea_actual.codigo,
      'subtarea': p_parametros.tarea.codigo,
      'nuevo_orden': p_parametros.orden
    }, function(data){
      delete app.peticion_actual;
      app.fn.loader(false);
      app.tarea_actual.subtareas = data.subtareas;
    });

  };

  app.fn.del_tarea_documento = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    if(typeof p_parametros.$el != 'undefined') p_parametros.$el.addClass('opacidad-media');

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_tarea_documento', {
      'tarea': p_parametros.tarea,
      'contador': p_parametros.contador
    }, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;
      if(typeof p_parametros.$el != 'undefined') p_parametros.$el.remove();

      var i = app.fn.buscar_index_por_id(app.tarea_actual.documentos, 'id', p_parametros.contador);
      if(i >= 0) app.tarea_actual.documentos.splice(i, 1);

      app.tarea_actual._actualizar_dom();

    });

  };

  app.fn.ins_tarea_etiqueta = function(p_parametros) {

    if(typeof p_parametros.etiqueta === 'undefined') p_parametros.etiqueta = '';
    if(typeof p_parametros.nombre === 'undefined') p_parametros.nombre = '';

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    p_parametros.tarea.$dom.addClass('dom-cargando');
    app.fn.desactivar_timeout();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/ins_tarea_etiqueta', {
      'tarea': p_parametros.tarea.codigo,
      'etiqueta': p_parametros.etiqueta,
      'nombre': p_parametros.nombre
    }, function(data) {

      app.fn.loader(false);
      p_parametros.tarea.$dom.removeClass('dom-cargando');
      delete app.peticion_actual;

      if(data.etiqueta != '') {

        var i = app.fn.buscar_index_por_id(app._etiquetas, 'codigo', data.etiqueta);
        if(p_parametros.etiqueta === '' && i < 0) {

          var e = new app._etiqueta({'codigo': data.etiqueta, 'nombre': p_parametros.nombre, 'color': data.color});
          app._etiquetas.push(e);
          var $el = app.tpl.gtd.sidebar.find('.sidebar-etiquetas').find('.sidebar-lista');

          $el.append('<li class="sidebar-lista-item"><button class="etiqueta-'+ e.codigo + '" data-etiqueta="' + e.codigo + '">' + e.icono + '<span>' + e.nombre + '</span></button></li>');

        };

        p_parametros.tarea.etiquetas.push(data.etiqueta);
        p_parametros.tarea._actualizar_campo({'campo': 'ETIQUETA'});

      };

    });

  };

  app.fn.del_tarea_etiqueta = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    p_parametros.tarea.$dom.addClass('dom-cargando');
    app.fn.desactivar_timeout();

    if(typeof p_parametros.$el != 'undefined') p_parametros.$el.addClass('opacidad-media');

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_tarea_etiqueta', {
      'tarea': p_parametros.tarea.codigo,
      'etiqueta': p_parametros.etiqueta
    }, function(data) {

      app.fn.loader(false);
      p_parametros.tarea.$dom.removeClass('dom-cargando');
      delete app.peticion_actual;

      if(typeof p_parametros.$el != 'undefined') p_parametros.$el.remove();

      var i = p_parametros.tarea.etiquetas.indexOf(p_parametros.etiqueta);
      if(i >= 0) p_parametros.tarea.etiquetas.splice(i, 1);

      if(data.limpiar_etiqueta === 'S') {
        var i = app.fn.buscar_index_por_id(app._etiquetas, 'codigo', p_parametros.etiqueta);
        if(i >= 0) app._etiquetas.splice(i, 1);
        $('.etiqueta-' + p_parametros.etiqueta).remove();
      };

      if(app.etiqueta_actual != null && typeof app.etiqueta_actual.codigo != 'undefined' && app.etiqueta_actual.codigo === p_parametros.etiqueta) {
        
        if(data.limpiar_etiqueta === 'S') {
          app.etiqueta_actual = null;
          app.parametros.etiqueta = '';
          app.tpl.gtd.proyecto.find('.sortable-panel').empty();
          app.tpl.gtd.menu_header.find('.etiqueta-nombre').css({'text-decoration': 'line-through'});
        } else {
          p_parametros.tarea.$dom.detach();
        };

      };

      p_parametros.tarea._actualizar_campo({'campo': 'ETIQUETA'});

    });

  };

  app.fn.upd_etiqueta = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    if(typeof p_parametros.valor === 'undefined') p_parametros.valor = '';

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_etiqueta', {'etiqueta': p_parametros.etiqueta.codigo, 'campo': p_parametros.campo, 'valor': p_parametros.valor}, function(data) {

      delete app.peticion_actual;
      app.fn.loader(false);
      app.fn.desactivar_region_modal(app.tpl.region.r_gestion_campo);
      app.etiqueta_actual = null;
      app.fn.cambiar_etiqueta(p_parametros.etiqueta);

    });

  };

  app.fn.ins_tarea_comentario = function(p_parametros) {

    if(typeof p_parametros.tarea === 'undefined') p_parametros.tarea = app.tarea_actual.codigo;

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/ins_tarea_comentario', p_parametros, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      if(data.codigo != '') {
        app.tarea_actual._actualizar_campo({'campo': 'COMENTARIOS'});
      };

    });

  };

  app.fn.del_tarea_comentario = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    if(typeof p_parametros.$el != 'undefined') p_parametros.$el.addClass('opacidad-media');

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_tarea_comentario', {
      'comentario': p_parametros.comentario
    }, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      app.tarea_actual._actualizar_campo({'campo': 'COMENTARIOS'});

    });

  };

  app.fn.set_tarea_campo_aux = function(p_parametros) {

    if(typeof p_parametros.tarea === 'undefined') p_parametros.tarea = app.tarea_actual.codigo;

    var t = (app.tarea_actual != null) ? app.tarea_actual : app.fn.buscar_por_id(app._tareas, 'codigo', parseInt(p_parametros.tarea));

    p_parametros.proyecto = (app.proyecto_actual != null) ? app.proyecto_actual.codigo : t._get_proyecto().codigo;
    
    var v_campo = p_parametros.campo.split('_');
    p_parametros.campo_aux = v_campo[0];
    p_parametros.tipo_despliegue = v_campo[1];

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    t.$dom.addClass('dom-cargando');
    app.fn.desactivar_timeout();

    p_parametros.recargar = ((app.agrupacion === p_parametros.campo) ? 'S' : 'N');

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/set_tarea_campo_aux', p_parametros, function(data) {

      app.fn.loader(false);
      t.$dom.removeClass('dom-cargando');
      delete app.peticion_actual;

      if(p_parametros.recargar != 'S') {

        t._actualizar_campo({'campo': 'CAMPO_AUX', 'codigo': p_parametros.campo, 'valor': p_parametros.valor});

      } else {
        app.fn.procesar_gtd(data);
      };

    });

  };

  app.fn.set_campo_aux = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    p_parametros.p_proyecto = app.proyecto_actual.codigo;

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/set_campo_aux', p_parametros, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      app.fn.desactivar_region_modal(app.tpl.region.r_gestion_campo);
      app.fn.procesar_gtd(data);

    });

  };

  app.fn.upd_campo_aux = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    p_parametros.proyecto = app.proyecto_actual.codigo;

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_campo_aux', p_parametros, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      app.fn.procesar_gtd(data);

    });

  };

  app.fn.del_campo_aux = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    p_parametros.proyecto = app.proyecto_actual.codigo;

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_campo_aux', p_parametros, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      app.fn.desactivar_region_modal(app.tpl.region.r_gestion_campo);
      app.fn.procesar_gtd(data);

    });

  };

  app.fn.set_proyecto_permiso = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    p_parametros.proyecto = app.proyecto_actual.codigo;

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/set_proyecto_permiso', p_parametros, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      app.fn.procesar_gtd(data);

    });

  };

  app.fn.upd_proyecto_permiso = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    p_parametros.proyecto = app.proyecto_actual.codigo;

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/upd_proyecto_permiso', p_parametros, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      app.fn.procesar_gtd(data);

    });

  };

  app.fn.del_proyecto_permiso = function(p_parametros) {

    app.fn.loader(true, {invisible: true, tipo: 'sincronizando'});
    app.fn.desactivar_timeout();

    p_parametros.proyecto = app.proyecto_actual.codigo;

    app.peticion_actual = app.fn.ajax(app.opts.api + app.opts.modulo + '/del_proyecto_permiso', p_parametros, function(data) {

      app.fn.loader(false);
      delete app.peticion_actual;

      // tendremos que recargar la lista
      app._buscador_permisos.permisos = [];

      app.fn.procesar_gtd(data);

    });

  };

  app.fn.navegar_expediente_bpm = function(p_parametros) {

    if(p_parametros.m === 'crmmebpm') p_parametros.gestionar_numero_expediente = p_parametros.numero_expediente;

    if(!app.integracion_forms) {

      app.fn.desactivar_timeout();

      p_parametros.id_port_origen = ((app.opts.id_port != '') ? app.opts.id_port : app.opts.csrf_token);
      
      app.fn.lanza_url(p_parametros.m, p_parametros, 'POST', false, 'modal', function(){
        app.fn.activar_timeout();
      });

    } else {

      app.fn.abrir_programa_forms({
        'programa': p_parametros.m,
        'parametros': p_parametros
      });

    };

  };

  /**
   * Función que activa el refresco automático
   * @memberof gtd
   */
  app.fn.activar_timeout = function() {

    if(app.parametros.segundos_refresco > 0) {

      clearTimeout(app.timeout);

      app.timeout = setTimeout(function() {

        app.fn.control_cambiar_proyecto();
        app.fn.cargar_gtd();

      }, (app.parametros.segundos_refresco * 1000));

    };

  };

  /**
   * Función que desactiva el refresco automático
   * @memberof gtd
   */
  app.fn.desactivar_timeout = function() {

    clearTimeout(app.timeout);

  };

  app.fn.control_cambiar_proyecto = function() {

    if(app.parametros.cambiar_proyecto_al_refrescar !== 'N' && app.proyecto_actual != null && app._proyectos.length > 1) {

      var v_limite_recursivo = 9999;
      var v_bucle = 0;

      var f_siguiente_proyecto = function(p_index) {
        v_bucle += 1;
        if(v_bucle === v_limite_recursivo) return;
        if(p_index > (app._proyectos.length - 1)) p_index = 0;
        if(app._proyectos[p_index].esta_archivado() || (app.parametros.cambiar_proyecto_al_refrescar === 'P' && app._proyectos[p_index].tipo === 'U')) {
          f_siguiente_proyecto(p_index + 1);
        } else {
          app.fn._restablecer_parametros_vista();
          app.parametros.proyecto = app._proyectos[p_index].codigo;
        };
      };

      var i = app.fn.buscar_index_por_id(app._proyectos, 'codigo', app.proyecto_actual.codigo);
      f_siguiente_proyecto(i + 1);

    };

  };

  app.fn.anular_peticion_actual = function() {

    if(typeof app.peticion_actual != 'undefined') {
      if(typeof app.peticion_actual.abort === 'function') app.peticion_actual.abort();
      delete app.peticion_actual;
    };

  };

  // declaramos las funciones públicas

  return app;

});
