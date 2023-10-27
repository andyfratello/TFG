/**
 * Objeto para Diagramas de Gantt de MOVILIDAD
 * @return    {String}
 * @memberof  app.ob
 * @namespace assets
 */

// https://snippet.dhtmlx.com/lk00rnjn?text=gantt.&mode=wide 

var gantt_movilidad = function () {
  return this;
};

gantt_movilidad.prototype = {

  opciones: {
    'grid': {
      'activo': true,
      'expandido': true,
      'ancho': 400,
      'ancho_minimo': 320,
      'columnas': []
    },
    'recursos': {
      'activo': false,
      'datos': [],
      'columnas': []
    },
    'columna_ordenacion': '', // tiene que ser una columna con valor numérico
    'zoom_inicial': '',       // por defecto se ajustará al espacio disponible (hours, days, weeks, months, quarters, years)
    'mostrar_ruta_critica': true,
    'mostrar_retraso_tarea': true,
    'proyectos': {
      'actualizar_progreso': false,
      'mostrar_limite': false
    },
    'formateados': {
      'fecha': {},
      'duracion': {},
      'enlaces': {}
    }, 
    'eventos': {
      'pulsar_tarea': null,
      'abrir_tarea': null,
      'arrastrar_tarea': null,
      'mover_tarea': null,
      'actualizar_tarea': null,
      'renderizar_gantt': null,
      'recargar_datos': null
    },
    'dom': {
      'wrapper': null
    }
  },

  data: {},

  lang: {}

};

gantt_movilidad.prototype.constructor = gantt_movilidad;

gantt_movilidad.prototype.inicializar = function(app, p_opciones, p_callback) {

  var _this = this;

  if(typeof p_opciones === 'undefined') return; 
  if(typeof p_opciones.dom === 'undefined') return;
  if(typeof p_opciones.dom.wrapper === 'undefined') return;

  _this.opciones = app.fn.unir(_this.opciones, p_opciones);

  _this.preparar_etiquetas_idioma(app);
  
  _this.preparar_dom();

  app.fn.ejecutar_plugin('gantt', function() {
    
    _this.generar_gantt(app, p_callback);

  }, 'files/plugins/dhtmlxgantt-pro', app.global);
  
};

gantt_movilidad.prototype.preparar_etiquetas_idioma = function(app) {
  
  var _this = this;

  if(typeof app.opts._calendario !== 'undefined') {
    _this.lang = app.fn.clonar(app.opts._calendario);
  } else {
    _this.lang = {
      nombres_meses: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
      nombres_dias: ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'],
      nombres_dias_cortos: ['Do','Lu','Ma','Mi','Ju','Vi','Sa']
    };
  };

  _this.lang.nombres_meses_cortos = [];
  for(var i in _this.lang.nombres_meses) {
    _this.lang.nombres_meses_cortos.push( _this.lang.nombres_meses[i].substring(0, 3) );
  };

  _this.lang = app.fn.unir(_this.lang, {
    duracion: {
      minuto: {singular: 'minuto', plural: 'minutos', corto: 'min'},
      hora: {singular: 'hora', plural: 'horas', corto: 'h'},
      dia: {singular: 'día', plural: 'días', corto: 'd'},
      semana: {singular: 'semana', plural: 'semanas', corto: 'sem'},
      mes: {singular: 'mes', plural: 'meses', corto: 'm'},
      ejercicio: {singular: 'año', plural: 'años', corto: 'a'}
    },
    section_description: app.opts.lang.descripcion,
    section_time: "Time period",
    link_from: app.opts.lang.desde,
    link_to: app.opts.lang.hasta,
    link_start: app.opts.lang.inicio,
    link_end: "End",
    minutes: "Minutos",
    hours: "Horas",
    days: "Días",
    weeks: "Semanas",
    months: "Meses",
    years: "Años",
    type_project: "Proyecto",
    type_task: "Tarea",
    column_duration: "Duración",
    column_start_date: "Fecha Inicio",
    column_end_date: "Fecha Fin",
    column_progress: "Progreso",
    column_text: "Tarea",
    column_idt: "ID",
    section_baseline: "Planificada",
    resource: "Recurso",
    resources: "Recursos",
    workload: "Carga de Trabajo"
  });

};

gantt_movilidad.prototype.preparar_dom = function() {
  
  var _this = this;

  _this.opciones.dom.wrapper = $(_this.opciones.dom.wrapper);
  
  // contenedor principal
  _this.opciones.dom.wrapper_container = $('<div class="wrapper-gantt-movilidad"></div>');

  // controles
  _this.opciones.dom.gantt_controles = $('<header class="gantt-controles"></header>');
  _this.opciones.dom.gantt_controles_grid = $('<div class="gantt-controles-grid"></div>');
  _this.opciones.dom.gantt_controles_timeline = $('<div class="gantt-controles-timeline"></div>');

  _this.opciones.dom.btn_grid_ocultar = $('<button class="no-border" data-accion="ocultar"><span class="icon icon-chevron-' + ((_this.opciones.grid.activo) ? 'left' : 'right') + '"></span></button>').appendTo( _this.opciones.dom.gantt_controles_grid );
  _this.opciones.dom.btn_grid_colapsar = $('<button class="no-border" data-accion="colapsar"><span class="icon icon-chevron-up"></span></button>').appendTo( _this.opciones.dom.gantt_controles_grid );
  _this.opciones.dom.btn_grid_expandir = $('<button class="no-border" data-accion="expandir"><span class="icon icon-chevron-down"></span></button>').appendTo( _this.opciones.dom.gantt_controles_grid );
  _this.opciones.dom.btn_recargar_datos = $('<button class="no-border oculto" data-accion="recargar_datos"><span class="icon icon-redo"></span></button>').appendTo( _this.opciones.dom.gantt_controles_grid );
  if( _this.opciones.mostrar_ruta_critica ) _this.opciones.dom.btn_ruta_critica = $('<button class="no-border" data-accion="ruta_critica"><span class="icon icon-wave-square"></span></button>').appendTo( _this.opciones.dom.gantt_controles_grid );
  _this.opciones.dom.wrapper_grid_filtrar = $('<div class="gantt-wrapper-filtrar"><button class="icono-campo icon icon-search"></button><button class="limpiar-campo icon icon-times-circle oculto"></button><input type="text" class="sin-valor" />').appendTo( _this.opciones.dom.gantt_controles_grid );
  _this.opciones.dom.input_filtrar = _this.opciones.dom.wrapper_grid_filtrar.find('input');

  _this.opciones.dom.wrapper_grid_rango_fechas = $('<div class="gantt-wrapper-filtrar"><button class="icono-campo icon icon-calendar"></button><button class="limpiar-campo icon icon-times-circle oculto"></button><input id="rango_fechas" rel="rango_fechas" name="rango_fechas" type="text" class="tal flatpickr sin-valor" value="" inputmode="text" autocomplete="off" />').appendTo( _this.opciones.dom.gantt_controles_grid );
  _this.opciones.dom.input_rango_fechas = _this.opciones.dom.wrapper_grid_rango_fechas.find('input');

  _this.opciones.dom.btn_timeline_zoom = $('<select class="" data-accion="zoom"><option value="hours">' + _this.lang.hours + '</option><option value="days">' + _this.lang.days + '</option><option value="weeks">' + _this.lang.weeks + '</option><option value="months">' + _this.lang.months + '</option><option value="years">' + _this.lang.years + '</option></select>').appendTo( _this.opciones.dom.gantt_controles_timeline );
  _this.opciones.dom.btn_timeline_zoomin = $('<button class="no-border" data-accion="zoom_in"><span class="icon icon-plus"></span></button>').appendTo( _this.opciones.dom.gantt_controles_timeline );
  _this.opciones.dom.btn_timeline_zoomout = $('<button class="no-border" data-accion="zoom_out"><span class="icon icon-minus"></span></button>').appendTo( _this.opciones.dom.gantt_controles_timeline );
  _this.opciones.dom.btn_timeline_zoomfit = $('<button class="no-border" data-accion="zoom_fit"><span class="icon icon-compress-wide"></span></button>').appendTo( _this.opciones.dom.gantt_controles_timeline );

  _this.opciones.dom.gantt_controles.append( _this.opciones.dom.gantt_controles_grid, _this.opciones.dom.gantt_controles_timeline );

  // seccion del diagrama
  _this._id_dom = 'gantt_' + app.fn.microtime();
  _this.opciones.dom.gantt_container = $('<section class="gantt-movilidad" id="' + _this._id_dom + '"></section>');

  _this.opciones.dom.wrapper_container.append( _this.opciones.dom.gantt_controles, _this.opciones.dom.gantt_container );

  _this.opciones.dom.wrapper.append( _this.opciones.dom.wrapper_container );

  if(_this.opciones.dom.input_rango_fechas.length > 0 && typeof $.fn.paneldate === 'function') {

    app.fn.ejecutar_plugin('flatpickr', function() {

      var v_formato = app.opts.mask.fecha.slice(0);
      
      v_formato = v_formato.replace('YYYY', 'Y');
      v_formato = v_formato.replace('YY', 'y');
      v_formato = v_formato.replace('MM', 'm');
      v_formato = v_formato.replace('DD', 'd');
      
      var v_opciones_flatpickr = {
        'dateFormat': v_formato,
        'allowInput': true,
        //'clickOpens': false,
        'mode': 'range',
        'locale': app.opts.usuario.locale,
        'onChange': function(selectedDates, dateStr, instance) {
          
          if(selectedDates.length === 0) {
            _this.actualizar_rango_fechas();
          } else if(selectedDates.length === 2) {
            _this.actualizar_rango_fechas({'fecha_inicio': selectedDates[0], 'fecha_fin': selectedDates[1]});
          };

        }
      };

      _this.opciones.dom.input_rango_fechas.flatpickr(v_opciones_flatpickr);
      
    }, 'files/plugins/flatpickr', $.fn);

    _this.opciones.dom.wrapper_grid_rango_fechas.find('.limpiar-campo').on('click', function() {
      _this.actualizar_rango_fechas();
    });

    _this.opciones.dom.wrapper_grid_rango_fechas.find('.icono-campo').on('click', function() {
      _this.opciones.dom.input_rango_fechas.focus();
    });

  };

};

gantt_movilidad.prototype.actualizar_rango_fechas = function(p_valores) {
  
  var _this = this;

  if(typeof p_valores === 'undefined') p_valores = {};
  if(typeof p_valores.fecha_inicio === 'undefined') p_valores.fecha_inicio = null;
  if(typeof p_valores.fecha_fin === 'undefined') p_valores.fecha_fin = null;

  var v_tiene_valor = !app.fn.es_nulo( _this.opciones.dom.input_rango_fechas.val() );

  if(p_valores.fecha_inicio === null && p_valores.fecha_fin === null) {
    if( v_tiene_valor ) _this.opciones.dom.input_rango_fechas.val('');
    v_tiene_valor = false;
  };

  _this.opciones.dom.wrapper_grid_rango_fechas.find('.icono-campo').toggle( !v_tiene_valor );
  _this.opciones.dom.wrapper_grid_rango_fechas.find('.limpiar-campo').toggle( v_tiene_valor );
  _this.opciones.dom.input_rango_fechas.toggleClass('sin-valor', !v_tiene_valor);

  gantt.config.start_date = p_valores.fecha_inicio;
  gantt.config.end_date = p_valores.fecha_fin;
  gantt.render();

};

gantt_movilidad.prototype.preparar_configuracion_gantt = function() {
  
  var _this = this;

  if(typeof _this.opciones.grid === 'undefined') _this.opciones.grid = {};
  if(typeof _this.opciones.grid.activo === 'undefined') _this.opciones.grid.activo = true;
  if(typeof _this.opciones.grid.expandido === 'undefined') _this.opciones.grid.expandido = true;
  if(typeof _this.opciones.grid.ancho === 'undefined') _this.opciones.grid.ancho = 400;
  if(typeof _this.opciones.grid.ancho_minimo === 'undefined') _this.opciones.grid.ancho_minimo = 320;
  if(typeof _this.opciones.grid.columnas === 'undefined') _this.opciones.grid.columnas = [];

  if(typeof _this.opciones.recursos === 'undefined') _this.opciones.recursos = {};
  if(typeof _this.opciones.recursos.activo === 'undefined') _this.opciones.recursos.activo = false;
  if(typeof _this.opciones.recursos.datos === 'undefined') _this.opciones.recursos.datos = [];
  if(typeof _this.opciones.grid.columnas === 'undefined') _this.opciones.grid.columnas = [];

  if(typeof _this.opciones.proyectos === 'undefined') _this.opciones.proyectos = {};
  if(typeof _this.opciones.proyectos.actualizar_progreso === 'undefined') _this.opciones.proyectos.actualizar_progreso = false;
  if(typeof _this.opciones.proyectos.mostrar_limite === 'undefined') _this.opciones.proyectos.mostrar_limite = false;

  if(typeof _this.opciones.mostrar_ruta_critica === 'undefined') _this.opciones.mostrar_ruta_critica = true;
  if(typeof _this.opciones.mostrar_retraso_tarea === 'undefined') _this.opciones.mostrar_retraso_tarea = true;

  if(typeof _this.opciones.formateados === 'undefined') _this.opciones.formateados = {};
  if(typeof _this.opciones.formateados.fecha === 'undefined') _this.opciones.formateados.fecha = {};
  if(typeof _this.opciones.formateados.duracion === 'undefined') _this.opciones.formateados.duracion = {};
  if(typeof _this.opciones.formateados.enlaces === 'undefined') _this.opciones.formateados.enlaces = {};

  // desactivamos los recursos si no hay datos enviados
  if( _this.opciones.recursos.datos.length === 0 ) _this.opciones.recursos.activo = false;

  gantt.config.task_height = 28;
  gantt.config.row_height = 30;
  gantt.config.duration_unit = "day";
  gantt.config.types.fase = "fase";
  gantt.config.types.grupo = "grupo";
  gantt.config.types.subgrupo = "subgrupo";
  gantt.config.date_format = "%Y-%m-%d %H:%i:%s";
  gantt.config.sort = false;
  gantt.config.keep_grid_width = false;
  gantt.config.grid_resize = true;
  gantt.config.reorder_grid_columns = true;
  gantt.config.highlight_critical_path = true;
  gantt.config.font_width_ratio = 7;

  //gantt.config.order_branch = true;
  if( _this.opciones.grid.expandido ) gantt.config.open_tree_initially = true;

  // esta opcion desactiva los tooltips
  //gantt.config.touch = "force";
  // esta opcion no ajusta el contenido
  //gantt.config.autosize = true;
  
  if( _this.opciones.grid.columnas.length > 0 ) gantt.config.columns = _this.opciones.grid.columnas;

  gantt.plugins({
    critical_path: true
  });

  _this.preparar_locale();

  _this.preparar_formateados();

  _this.preparar_layout();

  _this.preparar_estilos_tareas();

  _this.preparar_recursos();
  
  _this.preparar_controles();

  _this.preparar_zoom();

  _this.preparar_tooltips();

  _this.preparar_eventos();

};

gantt_movilidad.prototype.preparar_locale = function() {

  var _this = this;

  gantt.locale = {
    'date':{
      'month_full': _this.lang.nombres_meses,
      'month_short': _this.lang.nombres_meses_cortos,
      'day_full': _this.lang.nombres_dias,
      'day_short': _this.lang.nombres_dias_cortos
    },
    'labels': _this.lang
  };

};

gantt_movilidad.prototype.preparar_formateados = function() {

  var _this = this;

  // comprobamos si existe el formateado por defecto para el tooltip
  if( typeof _this.opciones.formateados.duracion['linkFormatter'] === 'undefined' ) {

    _this.opciones.formateados.duracion['linkFormatter'] = {
      enter: "day",
      store: "day",
      format: "auto",
      short: false,
      minutesPerHour: 60,
      hoursPerDay: 8,
      hoursPerWeek: 40,
      daysPerMonth: 30,
      daysPerYear: 365,
      labels: {
        minute: {
          full: _this.lang.duracion.minuto.singular,
          plural: _this.lang.duracion.minuto.plural,
          short: _this.lang.duracion.minuto.corto
        },
        hour: {
          full: _this.lang.duracion.hora.singular,
          plural: _this.lang.duracion.hora.plural,
          short: _this.lang.duracion.hora.corto
        },
        day: {
          full: _this.lang.duracion.dia.singular,
          plural: _this.lang.duracion.dia.plural,
          short: _this.lang.duracion.dia.corto
        },
        week: {
          full: _this.lang.duracion.semana.singular,
          plural: _this.lang.duracion.semana.plural,
          short: _this.lang.duracion.semana.corto
        },
        month: {
          full: _this.lang.duracion.mes.singular,
          plural: _this.lang.duracion.mes.plural,
          short: _this.lang.duracion.mes.corto
        },
        year: {
          full: _this.lang.duracion.ejercicio.singular,
          plural: _this.lang.duracion.ejercicio.plural,
          short: _this.lang.duracion.ejercicio.corto
        }
      }
    };

  };

  if( typeof _this.opciones.formateados.enlaces['linksFormatter'] === 'undefined' ) {

    _this.opciones.formateados.enlaces['linksFormatter'] = 'linkFormatter';

  };

  for(var i in _this.opciones.formateados.duracion) {

    gantt.templates[i] = gantt.ext.formatters.durationFormatter( _this.opciones.formateados.duracion[i] );

  };

  for(var i in _this.opciones.formateados.enlaces) {

    gantt.templates[i] = gantt.ext.formatters.linkFormatter({ 'durationFormatter': gantt.templates[_this.opciones.formateados.enlaces[i]] });

  };

  // fechas
  if( typeof _this.opciones.formateados.fecha['simple_date_format'] === 'undefined' ) {
    _this.opciones.formateados.fecha['simple_date_format'] = "%d/%m/%Y";
  };

  if( typeof _this.opciones.formateados.fecha['tooltip_date_format'] === 'undefined' ) {
    _this.opciones.formateados.fecha['tooltip_date_format'] = "%d/%m/%Y %H:%i";
  };

  if( typeof _this.opciones.formateados.fecha['libra_date_format'] === 'undefined' ) {

    var v_formato = app.opts.mask.fecha.slice(0);

    v_formato = v_formato.replace('YYYY', '%Y');
    v_formato = v_formato.replace('YY', '%y');
    v_formato = v_formato.replace('MM', '%m');
    v_formato = v_formato.replace('DD', '%d');

    _this.opciones.formateados.fecha['libra_date_format'] = v_formato + " %H:%i:00";

  };

  gantt.templates.dateFormat = function(p_date, p_formateado) {
    var formatFunc = gantt.date.date_to_str( _this.opciones.formateados.fecha[p_formateado] );
    return formatFunc(p_date);
  };
  
};

gantt_movilidad.prototype.preparar_layout = function() {

  var _this = this;
  
  _this.opciones.dom.btn_grid_ocultar.find('.icon').removeClass('icon-angle-left icon-angle-right').addClass('icon-angle-' + ((_this.opciones.grid.activo) ? 'left' : 'right'));
  
  var v_cols = [];

  if( _this.opciones.grid.activo ) {

    v_cols.push({
      width: _this.opciones.grid.ancho,
      min_width: _this.opciones.grid.ancho_minimo,
      rows: [
        { view: "grid", scrollX: "gridScroll", scrollable: true, scrollY: "scrollVer" },
        { view: "scrollbar", id: "gridScroll", group:"horizontalScrolls" }
      ],
      gravity: 2
    });

    v_cols.push({ resizer: true, width: 1 });

  };

  v_cols.push({
    rows: [
      { view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer" },
      { view: "scrollbar", id: "scrollHor", group:"horizontalScrolls" }
    ],
    gravity: 1
  });

  v_cols.push({ view: "scrollbar", id: "scrollVer" });

  v_rows = [{
    cols: v_cols,
    gravity: 2
  }];

  if( _this.opciones.recursos.activo ) {

    v_rows.push({ resizer: true, width: 1 });

    v_cols = [];

    if( _this.opciones.grid.activo ) {
      v_cols.push({ view: "resourceGrid", group: "grids", width: _this.opciones.grid.ancho, scrollY: "resourceVScroll" });
      v_cols.push({ resizer: true, width: 1 });
    };

    v_cols.push({ view: "resourceTimeline", scrollX: "scrollHor", scrollY: "resourceVScroll" });

    v_cols.push({ view: "scrollbar", id: "resourceVScroll", group: "vertical" });

    v_rows.push({ config: _this.obtener_configuracion_recursos(), cols: v_cols, gravity: 1 });

    v_rows.push({ view: "scrollbar", id: "scrollHor" });

  };

  gantt.config.layout = {
    css: "gantt_container",
    rows: v_rows
  };

};

gantt_movilidad.prototype.obtener_configuracion_recursos = function() {

  var _this = this;

  if( _this.opciones.recursos.columnas.length === 0 ) {

    _this.opciones.recursos.columnas = [{
      name: "name", label: _this.lang.resource, tree: false, template: function (resource) {
        return resource.text;
      }
    }];

  };

  var v_config = {'columns': _this.opciones.recursos.columnas};

  /*v_config.columns = [
    {
      name: "name", label: _this.lang.resource, tree: true, template: function (resource) {
        return resource.text;
      }
    },
    {
      name: "workload", label: _this.lang.workload, align: "right", template: function (resource) {

        var tasks;
        var store = gantt.getDatastore(gantt.config.resource_store),
            field = gantt.config.resource_property;

        if (store.hasChild(resource.id)) {
          tasks = gantt.getTaskBy(field, store.getChildren(resource.id));
        } else {
          tasks = gantt.getTaskBy(field, resource.id);
        };

        var totalDuration = 0;
        for (var i = 0; i < tasks.length; i++) {
          totalDuration += tasks[i].duration;
        };

        return (totalDuration || 0) * 8 + "h";

      }
    }
  ];*/

  return v_config;

};

gantt_movilidad.prototype.preparar_estilos_tareas = function() {

  var _this = this;

  ganttModules.grid_struct = (function(gantt) {

      gantt.dateToStr = gantt.date.date_to_str("%j %F %H:%i");

      _this._getTaskFitValue = function(task) {
    
        var taskStartPos = gantt.posFromDate(task.start_date),
            taskEndPos = gantt.posFromDate(task.end_date);
    
        var width = taskEndPos - taskStartPos;
        var textWidth = (task.text || "").length * gantt.config.font_width_ratio;
    
        if(width < textWidth) {
          var ganttLastDate = gantt.getState().max_date;
          var ganttEndPos = gantt.posFromDate(ganttLastDate);
          if(ganttEndPos - taskEndPos < textWidth) {
            return "left";
          } else {
            return "right";
          };
        } else {
          return "center";
        };
    
      };

      gantt.templates.leftside_text = function (start, end, task) {
        
        var state = gantt.getState(), modes = gantt.config.drag_mode;

        var v_text = '';

        if (state.drag_id == task.id) {
          if (state.drag_mode == modes.move || (state.drag_mode == modes.resize && state.drag_from_start)) {
            v_text = gantt.dateToStr( gantt.roundDate(start) );
          };
        };

        return v_text;

      };

      gantt.templates.rightside_text = function rightSideTextTemplate(start, end, task) {

        var state = gantt.getState(), modes = gantt.config.drag_mode;

        var v_text = '';

        if (state.drag_id == task.id) {
          if (state.drag_mode == modes.move || (state.drag_mode == modes.resize && state.drag_from_start)) {
            v_text = gantt.dateToStr( gantt.roundDate(start) );
          };
        };

        if( v_text === '' && _this._getTaskFitValue(task) === "right" ) v_text = task.text;
        
        if( _this.opciones.mostrar_retraso_tarea ) {
            
          if( typeof task.planned_end !== 'undefined' && task.planned_end !== '' ) {
            if (end.getTime() > task.planned_end.getTime()) {
              var overdue = Math.ceil(Math.abs((end.getTime() - task.planned_end.getTime()) / ( 60 * 60 * 1000)));
              v_text += ' <span class="color_libra_rojo"><span class="icon icon-exclamation-triangle pr1"></span>' + overdue + '</span>';
            };
          };

        };

        return v_text;

      };

      gantt.templates.task_text = function taskTextTemplate(start, end, task){
        if( _this._getTaskFitValue(task) === "center" ) return task.text;
        return "";
      };

  })(gantt);

  gantt.templates.task_class = function (start, end, task) {
    var classes = [];
    if (task.planned_end) {
      classes.push('has-baseline');
      if (end.getTime() > task.planned_end.getTime()) classes.push('overdue');
    };
    if (task.type === gantt.config.types.fase) {
      classes.push("fase");
    } else if (task.type === gantt.config.types.grupo) {
      classes.push( "grupo" );
    } else if (task.type === gantt.config.types.subgrupo) {
      classes.push( "subgrupo" );
    };
    return classes.join(' ');
  };

  gantt.templates.scale_cell_class = function (date) {
    var v_state = gantt.getState();
    if(v_state.scale_unit === 'hour') {
      if (date.getDay() === 0 || date.getDay() === 6) {
        return "weekend";
      };
    };
	};

	gantt.templates.timeline_cell_class = function (item, date) {
    var v_state = gantt.getState();
    if(v_state.scale_unit === 'day' || v_state.scale_unit === 'hour') {
      if (date.getDay() === 0 || date.getDay() === 6) {
        return "weekend";
      };
		};
	};

  if( _this.opciones.proyectos.mostrar_limite ) {

    gantt.addTaskLayer(function (task) {
      if (task.type === gantt.config.types.project) {
        var sizes = gantt.getTaskPosition(task, task.start_date, task.end_date);
        var maxHeight = sizes.height;
        gantt.eachTask(function (child) {
          var childSizes = gantt.getTaskPosition(child, child.start_date, child.end_date);
          if (maxHeight < (childSizes.top + childSizes.top)) maxHeight = childSizes.top + childSizes.height;
        }, task.id);
        var el = document.createElement('div');
        el.className = 'gantt_project_marker';
        el.style.left = sizes.left + 'px';
        el.style.height = maxHeight - sizes.top + 'px';
        el.style.top = sizes.top + 'px';
        return el;
      };
      return false;
    });

  };

  if( _this.opciones.proyectos.actualizar_progreso ) {

    gantt.parentProgress = function(id) {
      gantt.eachParent(function (task) {
        var children = gantt.getChildren(task.id);
        var childProgress = 0;
          for (var i = 0; i < children.length; i++) {
            var child = gantt.getTask(children[i]);
            childProgress += (child.progress * 100);
          };
          task.progress = childProgress / children.length / 100;
      }, id);
      gantt.render();
    };

  };

};

gantt_movilidad.prototype.preparar_recursos = function() {

  var _this = this;

  if( _this.opciones.recursos.activo ) {

    gantt.templates.resource_cell_class = function (start_date, end_date, resource, tasks) {
      var css = [];
      css.push("resource_marker");
      if (tasks.length <= 1) {
        css.push("workday_ok");
      } else {
        css.push("workday_over");
      };
      return css.join(" ");
    };

    gantt.templates.resource_cell_value = function (start_date, end_date, resource, tasks) {
      var cell_duration = gantt.calculateDuration({ start_date: start_date, end_date: end_date });

      var result = 0;
      tasks.forEach(function (item) {
        var assignments = gantt.getResourceAssignments(resource.id, item.id);
        assignments.forEach(function (assignment) {
          var task = gantt.getTask(assignment.task_id);
          var hours_amount = 0;

          if (+task.start_date <= +start_date && +task.end_date >= +end_date) {
            hours_amount += cell_duration;
          }
          //the task is in the left part
          else if (+task.start_date <= +start_date && +task.end_date >= +start_date && +task.end_date < +end_date) {
            var left_duration = gantt.calculateDuration({ start_date: start_date, end_date: task.end_date });
            hours_amount += left_duration;
          }
          //the task is in the right part
          else if (+task.end_date >= +end_date && +task.start_date >= +start_date && +task.start_date < +end_date) {
            var right_duration = gantt.calculateDuration({ start_date: task.start_date, end_date: end_date });
            hours_amount += right_duration;
          }
          //the task is inside cell
          else if (+task.start_date >= +start_date && +task.end_date <= +end_date) {
            var task_duration = gantt.calculateDuration({ start_date: task.start_date, end_date: task.end_date });
            hours_amount += task_duration;
          }

          result += assignment.value * hours_amount;
        });
      });

      if (result % 1) {
        result = Math.round(result * 10) / 10;
      }
      return "<div>" + result + "</div>";
    };

    gantt.attachEvent("onEmptyClick", function (e) {
      
      var domHelpers = gantt.utils.dom;
  
      // click on the circles in the Resource Timeline
      var resourceMarker = domHelpers.closest(e.target, ".resource_marker");
      if (resourceMarker) {
        var resourceId = resourceMarker.dataset["resourceId"];

        var assignments = gantt.getResourceAssignments(resourceId);

        var clickPosition = domHelpers.getRelativeEventPosition(e, gantt.$task_data).x;
        var clickDate = gantt.dateFromPos(clickPosition);

        var text = [];
        assignments.forEach(function (assignment) {
          var task = gantt.getTask(assignment.task_id);
          if (+task.start_date <= +clickDate && +clickDate <= +task.end_date) text.push('• ' + task.text + ': ' + assignment.value);
        });
        return gantt.message("Assgned tasks: <br>" + text.join("<br>"));
      };
  
      // click on the Resource Grid row
      var gridRow = domHelpers.closest(e.target, '.gantt_row');
      if (gridRow) {
          var resourceId = gridRow.dataset["resourceId"];
          if (!resourceId) return;
  
          var assignments = gantt.getResourceAssignments(resourceId);
  
          var text = [];
          assignments.forEach(function (assignment) {
            var task = gantt.getTask(assignment.task_id);
            text.push('• ' + task.text);
          });
          return gantt.message("Assgned tasks: <br>" + text.join("<br>"));
      };
  });

  gantt.attachEvent("onTaskSelected", function (id) {
    var store = gantt.getDatastore("resource");
    // Right now, you can select only one resource
    var assignment = gantt.getTaskAssignments(id)[0];
    if (assignment) {
      store.select(assignment.resource_id);

      // You can use this command if you need to scroll to that date manually:
      // const x = gantt.getLayoutView("resourceTimeline").posFromDate(assignment.start_date);

      var index = store.getIndexById(assignment.resource_id);
      var y = index * gantt.config.row_height;

      gantt.scrollLayoutCell("resourceTimeline", null, y);
    };
  });

    // opciones de recursos
    gantt.config.resource_store = "resource";
    gantt.config.resource_property = "owner";

    gantt.locale.labels.section_owner = "Owner";

  };
  
};

gantt_movilidad.prototype.registrar_recursos = function() {

  var _this = this;

  if( _this.opciones.recursos.activo ) {

    var resourcesStore = gantt.createDatastore({
      name: gantt.config.resource_store,
      type: "treeDatastore",
      initItem: function (item) {
        item.parent = item.parent || gantt.config.root_id;
        item[gantt.config.resource_property] = item.parent;
        item.open = true;
        return item;
      }
    });

    resourcesStore.attachEvent("onParse", function () {
      var people = [];
      resourcesStore.eachItem(function (res) {
        if (!resourcesStore.hasChild(res.id)) {
          var copy = gantt.copy(res);
          copy.key = res.id;
          copy.label = res.text;
          people.push(copy);
        };
      });
      gantt.updateCollection("people", people);
    });

    resourcesStore.parse( _this.opciones.recursos.datos );

  };

};

gantt_movilidad.prototype.preparar_zoom = function() {

  var _this = this;

  //zoom
  ganttModules.zoom = (function(gantt){

    var zoomConfig = {
      levels: [
        {
          name: "hours",
          scales: [
            {unit: "day", step: 1, format: "%d %M"},
            {unit: "hour", step: 1, format: "%G"}
          ],
          round_dnd_dates: true,
          min_column_width: 30,
          scale_height: 60
        },
        {
          name: "days",
          scales: [
            {unit: "month", step: 1, format: "%M"},
            {unit: "week", step: 1, format: "%W"},
            {unit: "day", step: 1, format: "%D %d"}
          ],
          round_dnd_dates: true,
          min_column_width: 30,
          scale_height: 60
        },
        {
          name: "weeks",
          scales: [
            {unit: "year", step: 1, format: "%Y"},
            {unit: "month", step: 1, format: "%M"},
            {unit: "week", step: 1, format: "%W"}
          ],
          round_dnd_dates: false,
          min_column_width: 60,
          scale_height: 60
        },
        {
          name: "months",
          scales: [
            {unit: "year", step: 1, format: "%Y"},
            {unit: "month", step: 1, format: "%M"}
          ],
          round_dnd_dates: false,
          min_column_width: 90,
          scale_height: 60
        },
        {
          name: "quarters",
          scales: [
            {unit: "year", step: 1, format: "%Y"},
            {unit: "quarter", step: 1, format: function quarterLabel(date) {

              var month = date.getMonth();
              var q_num;
      
              if (month >= 9) {
                q_num = 4;
              } else if (month >= 6) {
                q_num = 3;
              } else if (month >= 3) {
                q_num = 2;
              } else {
                q_num = 1;
              };
      
              return "Q" + q_num;

            }},
            {unit: "month", step: 1, format: "%M"}
          ],
          round_dnd_dates: false,
          min_column_width: 50,
          scale_height: 60
        },
        {
          name: "years",
          scales: [
            {unit: "year", step: 1, format: "%Y"}
          ],
          round_dnd_dates: false,
          min_column_width: 50,
          scale_height: 60
        }
      ]/*,
      useKey: "ctrlKey",
		  trigger: "wheel",
      element: function(){
			  return gantt.$root.querySelector(".gantt_task");
		  }*/
    };

    gantt.ext.zoom.init(zoomConfig);

    var isActive = true;

    return {
      get_config: function() {
        return zoomConfig;
      },  
      deactivate: function() {
        isActive = false;
      },
      setZoom: function(level) {
        isActive = true;
        gantt.ext.zoom.setLevel(level);
      },
      zoomOut: function() {
        isActive = true;
        gantt.ext.zoom.zoomOut();
        gantt.render();
      },
      zoomIn: function() {
        isActive = true;
        gantt.ext.zoom.zoomIn();
        gantt.render();
      },
      canZoomOut: function() {
        var level = gantt.ext.zoom.getCurrentLevel();

        return  !isActive || !(level > 4);
      },
      canZoomIn: function(){
        var level = gantt.ext.zoom.getCurrentLevel();
        return !isActive || !(level === 0);
      }
    };
  })(gantt);

  // zoom to fit
  ganttModules.zoomToFit = (function(gantt) {
    
    var cachedSettings = {};

    function saveConfig() {
      var config = gantt.config;
      cachedSettings = {};
      cachedSettings.scales = config.scales;
      cachedSettings.template = gantt.templates.date_scale;
      cachedSettings.start_date = config.start_date;
      cachedSettings.end_date = config.end_date;
    };

    function restoreConfig() {
      applyConfig(cachedSettings);
    };

    function applyConfig(config, dates) {

      if (config.scales[0].date) {
        gantt.templates.date_scale = null;
      } else {
        gantt.templates.date_scale = config.scales[0].template;
      };

      gantt.config.scales = config.scales;

      if (dates && dates.start_date && dates.start_date) {
        var v_pos = config.scales.length - 1;
        gantt.config.start_date = gantt.date.add(dates.start_date, -1, config.scales[v_pos].unit);
        gantt.config.end_date = gantt.date.add(gantt.date[config.scales[v_pos].unit + "_start"](dates.end_date), 2, config.scales[v_pos].unit || 1);
      } else {
        gantt.config.start_date = gantt.config.end_date = null;
      };

    };

    function zoomToFit() {

      var project = gantt.getSubtaskDates(),
        areaWidth = gantt.$task.offsetWidth,
        zoomConfig = ganttModules.zoom.get_config();

      var i = 0;
      for (i; i < zoomConfig.levels.length; i++) {
        var columnCount = getUnitsBetween(
            project.start_date,
            project.end_date,
            zoomConfig.levels[i].scales[zoomConfig.levels[i].scales.length - 1].unit,
            zoomConfig.levels[i].scales[0].step || 1
        );
        if ((columnCount + 2) * gantt.config.min_column_width <= areaWidth) break;
      };
  
      if (i === zoomConfig.levels.length) i--;
  
      var v_name = zoomConfig.levels[i].name;

      gantt.ext.zoom.setLevel(v_name);
      _this.opciones.dom.btn_timeline_zoom.val(v_name);

      applyConfig(zoomConfig.levels[i], project);
      gantt.render();

    };

    // get number of columns in timeline
    function getUnitsBetween(from, to, unit, step) {
      var start = new Date(from),
        end = new Date(to);
      var units = 0;
      while (start.valueOf() < end.valueOf()) {
        units++;
        start = gantt.date.add(start, step, unit);
      };
      return units;
    };

    return {
      zoomToFit: function() {
        saveConfig();
        zoomToFit();
        gantt.render();
      }
    };

  })(gantt);

  if( _this.opciones.zoom_inicial !== '' ) ganttModules.zoom.setZoom( _this.opciones.zoom_inicial );

};

gantt_movilidad.prototype.preparar_controles = function() {

  var _this = this;

  ganttModules.menu = (function() {

    _this._refrescar_botones_zoom = function(p_opciones) {

      if(typeof p_opciones === 'undefined') p_opciones = {};
      if(typeof p_opciones.actualizar_zoom === 'undefined') p_opciones.actualizar_zoom = true;

      if(p_opciones.actualizar_zoom) {
        var v_valor = gantt.ext.zoom._levels[ gantt.ext.zoom.getCurrentLevel() ].name;
        _this.opciones.dom.btn_timeline_zoom.val( v_valor );
      };

      var zoom = ganttModules.zoom;
      _this.opciones.dom.btn_timeline_zoomin.attr( 'disabled', !zoom.canZoomIn() );
      _this.opciones.dom.btn_timeline_zoomout.attr( 'disabled', !zoom.canZoomOut() );

    };

    _this._controles_menu = {
      zoom_in: function() {
        ganttModules.zoom.zoomIn();
        _this._refrescar_botones_zoom();
      },
      zoom_out: function() {
        ganttModules.zoom.zoomOut();
        _this._refrescar_botones_zoom();
      },
      zoom_fit: function() {
        ganttModules.zoomToFit.zoomToFit();
        _this._refrescar_botones_zoom();
      },
      ocultar: function() {
        _this.opciones.grid.activo = !_this.opciones.grid.activo;
        _this.preparar_layout();
        gantt.resetLayout();
      },
      colapsar: function() {
        _this.toggle_grid(false);
      },
      expandir: function() {
        _this.toggle_grid(true);
      },
      ruta_critica: function() {
        gantt.config.highlight_critical_path = !gantt.config.highlight_critical_path;
        gantt.render();
      }/*,
      toPDF: function() {
        gantt.exportToPDF();
      },
      toPNG: function() {
        gantt.exportToPNG();
      },
      toExcel: function() {
        gantt.exportToExcel();
      },
      toMSProject: function() {
        gantt.exportToMSProject();
      }*/
    };

    return {
      setup: function() {

        gantt.event(_this.opciones.dom.gantt_controles[0], 'click', function(e) {
          var target = e.target || e.srcElement;
          while(!target.hasAttribute('data-accion') && target !== document.body) {
            target = target.parentNode;
          };
          if(target && target.hasAttribute('data-accion')) {
            var accion = target.getAttribute('data-accion');
            if( _this._controles_menu[accion] ) _this._controles_menu[accion]();
          };
        });

        gantt.event(_this.opciones.dom.btn_timeline_zoom[0], 'change', function(e) {
          var target = e.target || e.srcElement;
          ganttModules.zoom.setZoom(target.value);
          _this._refrescar_botones_zoom({'actualizar_zoom': false});
        });

        this.setup = function(){};

      }
    };
  })(gantt);

  ganttModules.menu.setup();

  _this.preparar_buscador();

};

gantt_movilidad.prototype.toggle_grid = function(p_modo) {

  var _this = this;

  gantt.eachTask(function(task) {
    task.$open = p_modo;
  });
  
  gantt.render();

  if( _this.opciones.recursos.activo ) {

    var store = gantt.getDatastore(gantt.config.resource_store);

    store.eachItem(function (item) {
        item.$open = p_modo;
    });

    store.refresh();

  };

};

gantt_movilidad.prototype.preparar_buscador = function() {

  var _this = this;

  _this.opciones.dom.input_filtrar.off().on('keyup', function () {

    _this.actualizar_valor_buscador();

  }).on('blur', function () {

    _this.actualizar_valor_buscador({'refrescar_busqueda': false});

  });

  _this.opciones.dom.wrapper_grid_filtrar.find('.limpiar-campo').on('click', function() {
    _this.opciones.dom.input_filtrar.val('');
    _this.actualizar_valor_buscador();
  });

  _this.opciones.dom.wrapper_grid_filtrar.find('.icono-campo').on('click', function() {
    _this.opciones.dom.input_filtrar.removeClass('sin-valor').focus();
  });

  RegExp.escape = function(text) {
    if (!arguments.callee.sRE) {
      var specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
      ];
      arguments.callee.sRE = new RegExp(
        '(\\' + specials.join('|\\') + ')', 'g'
      );
    };
    return text.toLowerCase().replace(arguments.callee.sRE, '\\$1');
  };

  gantt.attachEvent("onBeforeTaskDisplay", function (p_id, p_task) {

    //var v_task = gantt.getTask(p_id);

    var v_buscador = _this._valor_buscador;

    if( typeof v_buscador !== 'undefined' && v_buscador !== '') {
      
      if( typeof p_task.text !== 'undefined' && p_task.text !== '' ) {

        v_buscador = RegExp.escape(v_buscador);
        v_buscador = v_buscador.replace("%", ".*").replace("_", ".");

        v_name = p_task.text.toLowerCase();
        var match = (new RegExp(v_buscador).exec(v_name) !== null);
        return match;

      };

    } else {
      return true;
    };
    
	});

};

gantt_movilidad.prototype.actualizar_valor_buscador = function(p_opciones) {

  var _this = this;

  if( typeof p_opciones === 'undefined' ) p_opciones = {};
  if( typeof p_opciones.refrescar_busqueda === 'undefined' ) p_opciones.refrescar_busqueda = true;

  _this._valor_buscador = _this.opciones.dom.input_filtrar.val();
  var v_tiene_valor = !app.fn.es_nulo( _this._valor_buscador );

  _this.opciones.dom.wrapper_grid_filtrar.find('.icono-campo').toggle( !v_tiene_valor );
  _this.opciones.dom.wrapper_grid_filtrar.find('.limpiar-campo').toggle( v_tiene_valor );
  _this.opciones.dom.input_filtrar.toggleClass('sin-valor', !v_tiene_valor);

  if( p_opciones.refrescar_busqueda ) gantt.refreshData();
  
};

gantt_movilidad.prototype.preparar_tooltips = function() {

  var _this = this;

  if(typeof gantt.plugins !== 'undefined') gantt.plugins({
    tooltip: true
  });

  gantt.templates.tooltip_text = function(start, end, task) {

    var links = task.$target;
    var labels = [];
    for (var i = 0; i < links.length; i++) { 
      var link = gantt.getLink(links[i]);
      labels.push( gantt.templates.linksFormatter.format(link) );
    };
    var predecessors = labels.join(", ");

    var html = "<p class='tooltip-task-text'>" + task.text + "</p><b>" + 'Fecha Inicio' + ":</b> " + 
        gantt.templates.dateFormat(start, 'tooltip_date_format') + 
        "<br/><b>" + 'Fecha Fin' + ":</b> " + gantt.templates.dateFormat(end, 'tooltip_date_format') + 
        "<br><b>" + 'Duración' + ":</b> " + gantt.templates.linkFormatter.format(task.duration);
    if (task.planned_start || task.planned_end) {
      html += "<br/><br/><b>Planificación</b>";
      if (task.planned_start) html += "<br/><b>Inicio:</b> " + gantt.templates.dateFormat(task.planned_start, 'tooltip_date_format');
      if (task.planned_end) html += "<br/><b>Fin:</b> " + gantt.templates.dateFormat(task.planned_end, 'tooltip_date_format');
    };
    if(predecessors) html +=  "<br><b>" + 'Predecesor' + ":</b>" + predecessors;
    return html;
    
  };

};

gantt_movilidad.prototype.generar_gantt = function(app, p_callback) {
  
  var _this = this;

  if(!window.ganttModules) window.ganttModules = {};

  _this.preparar_configuracion_gantt();

  gantt.init( _this._id_dom );

  if(typeof p_callback === 'function') p_callback.call();

};

gantt_movilidad.prototype.ordenar_tareas = function() {
  
  var _this = this;

  var v_ordenar_tareas = function(a,b) {
    a = (!isNaN(a[_this.opciones.columna_ordenacion])) ? parseInt(a[_this.opciones.columna_ordenacion]) : -9999;
    b = (!isNaN(b[_this.opciones.columna_ordenacion])) ? parseInt(b[_this.opciones.columna_ordenacion]) : -9999;
    return a>b?1:(a<b?-1:0);
  };

  gantt.sort( v_ordenar_tareas );

};

gantt_movilidad.prototype.preparar_fechas_planificadas = function(task) {

  if (task.planned_start && task.planned_end) {
    var sizes = gantt.getTaskPosition(task, task.planned_start, task.planned_end);
    var el = document.createElement('div');
    el.className = 'baseline';
    el.style.left = sizes.left - 6 + 'px';
    el.style.width = sizes.width + 10 + 'px';
    el.style.height = sizes.height + 6 + 'px';
    el.style.top = sizes.top - 1 + 'px';
    return el;
  };

  return false;

};

gantt_movilidad.prototype.preparar_datos_tarea = function( p_task ) {

  p_task.fecha_inicio = gantt.templates.dateFormat(p_task.start_date, 'libra_date_format');
  p_task.fecha_fin = gantt.templates.dateFormat(p_task.end_date, 'libra_date_format');

  return p_task;
  
};

gantt_movilidad.prototype.preparar_eventos = function() {

  // https://docs.dhtmlx.com/gantt/api__gantt_onaftertaskmove_event.html 

  var _this = this;

  gantt.attachEvent("onTaskClick", function (id, e) {
    if( typeof _this.opciones.eventos.pulsar_tarea === 'function' ) { 
      var task = gantt.getTask(id);
      _this.opciones.eventos.pulsar_tarea.call(this, {'task': _this.preparar_datos_tarea(task), 'id': id, 'e': e});
    };
    // dejamos el return true para que seleccione la tarea y lance el evento correspondiente
    return true;
  });

  gantt.attachEvent("onTaskDblClick", function (id, e) {
    if( typeof _this.opciones.eventos.abrir_tarea === 'function' ) { 
      var task = gantt.getTask(id);
      _this.opciones.eventos.abrir_tarea.call(this, {'task': _this.preparar_datos_tarea(task), 'id': id, 'e': e});
    };
    return false;
  });

  if( typeof _this.opciones.eventos.arrastrar_tarea === 'function' ) { 
    gantt.attachEvent("onAfterTaskDrag", function (id, mode, e) {
      var task = gantt.getTask(id);
      _this.opciones.eventos.arrastrar_tarea.call(this, {'task': _this.preparar_datos_tarea(task), 'id': id, 'e': e, 'mode': mode});
    });
  };

  if( _this.opciones.proyectos.actualizar_progreso ) {
    gantt.attachEvent("onTaskDrag", function (id, mode, task, original) {
      if (mode === "progress") gantt.parentProgress(id);
    });
  };

  if( typeof _this.opciones.eventos.mover_tarea === 'function' ) { 
    gantt.attachEvent("onAfterTaskMove", function (id, parent, tindex) {
      var task = gantt.getTask(id);
      _this.opciones.eventos.mover_tarea.call(this, {'task': _this.preparar_datos_tarea(task), 'id': id, 'parent': parent, 'tindex': tindex});
    });
  };

  gantt.attachEvent("onAfterTaskUpdate", function (id, item) {

    if( _this.opciones.proyectos.actualizar_progreso ) gantt.parentProgress(id);

    if( typeof _this.opciones.eventos.actualizar_tarea === 'function' ) { 
      _this.opciones.eventos.actualizar_tarea.call(this, {'task': _this.preparar_datos_tarea(item), 'id': id});
    };

  });

  gantt.attachEvent("onTaskLoading", function (task) {
    if( typeof task.planned_start !== 'undefined' && task.planned_start !== '' ) task.planned_start = gantt.date.parseDate(task.planned_start, gantt.config.date_format);
    if( typeof task.planned_end !== 'undefined' && task.planned_end !== '' ) task.planned_end = gantt.date.parseDate(task.planned_end, gantt.config.date_format);
    return true;
  });

  if( typeof _this.opciones.eventos.renderizar_gantt === 'function' ) { 
    gantt.attachEvent("onGanttRender", function (e) {
      _this.opciones.eventos.renderizar_gantt.call(this, {'e': e});
    });
  };

  gantt.attachEvent("onGanttReady", function () {
    gantt.addTaskLayer(_this.preparar_fechas_planificadas);
  });

  if( typeof _this.opciones.eventos.recargar_datos === 'function' ) {

    _this.opciones.dom.btn_recargar_datos.off().on('click', function(){
      _this.opciones.eventos.recargar_datos.call();
    }).show();

  };

};

gantt_movilidad.prototype.cargar_datos_gantt = function(p_data) {
  
  var _this = this;

  gantt.clearAll();

  // se tienen que registrar siempre los recursos tras el clearAll
  _this.registrar_recursos();

  gantt.parse( p_data );

  if( app.fn.es_nulo(_this.opciones.zoom_inicial) ) ganttModules.zoomToFit.zoomToFit();
  if( !app.fn.es_nulo(_this.opciones.columna_ordenacion) ) _this.ordenar_tareas();

};

app.fn.extender({
  nombre: 'gantt_movilidad',
  objeto: gantt_movilidad,
  namespace: 'ob'
}); 