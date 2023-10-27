/**
 * Gantt de la Carga de Máquinas
 * --------------------------------------------------------------------------------------------------
 * @copyright     2020 EDISA (c)
 * @version       2023.10.18
 * @class         p_ccmaqs
 * @augments      app
 * @constructor
 * @param {Object} o Opciones a sobreescribir
 */
var p_ccmaqs = (function (o) {

    var app = this;
  
    app.fn.cargar_opciones({
      //
    }, o);
  
    app.regiones = ['r_campos', 'r_gantt'];
  
    /**
     * Funcion inicial
     * @param {Object} data Objeto con los datos del ERP
     * @memberof p_ccmaqs
    */
    app.fn.inicio = function(data) {
  
      app.fn.generar_boton_nav('nav', 'help', 'icon-info-circle', app.opts.lang.informacion, function() {
        alert('EDISA');
      });
  
      app.fn.mostrar_campos();
  
    };
  
    /**
     * Mostrar Bloque de Campos
     * @memberof p_ccmaqs
     */
    app.fn.mostrar_campos = function() {
  
      app.fn.activar_region(app.tpl.region.r_campos, {vaciar: true, footer: false, modal: false, callback: function() {
  
        app.tpl.nav.help.show();
  
        app.fn.generar_bloque('campos', app.tpl.region.r_campos, {valores: {}}, function() {
  
          var v_btn_wrapper = app.tpl.region.r_campos.find('.button-contain');

          // comprobamos si existe algún campo obligatorio sin rellenar
          var v_btn_aceptar = app.fn.genera_boton('btn_aceptar', 'btnazul', app.opts.lang.mostrar_grafico, function() {
            
            // mirar si la simulación existe

            confirmaSobreescribir();
          }).appendTo(v_btn_wrapper);
            
        });
  
      }});
  
    };


    function confirmaSobreescribir() {
      msg.ask(app.opts.lang.msg_sobreescribir_simulacion, function(val) { 
        if(val === 'Y') {
          // llamada a eliminar gráfico
          if(!app.fn.validar_formulario(app.tpl.region.r_campos)) return false;
          var v_campos = app.fn.obtener_valores_form(app.tpl.region.r_campos);
          // llamada a insertar otra vez el gráfico
          app.fn.mostrar_gantt({'campos': v_campos});
        }
      }, { 
        'title': app.opts.lang.gantt, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar 
      });
    }


    /**
     * Mostrar gráfico Gantt
     * @param {Object} p_parametros Objeto con los parámetros de la consulta
     */
    app.fn.mostrar_gantt = function(p_parametros) {
      
      console.log('parametres: ', p_parametros.campos.planta_productiva, ' ', p_parametros.campos.codigo_simulacion, ' ', p_parametros.campos.fecha_inicio || null, ' ', p_parametros.campos.fecha_fin || null);
      var v_param = {
        'codigo_org_planta': p_parametros.campos.planta_productiva,
        'numero_simulacion': p_parametros.campos.codigo_simulacion,
        'hasta_proyecto': p_parametros.campos.hasta_proyecto || null,
        'desde_proyecto': p_parametros.campos.desde_proyecto || null,
        'hasta_maquina': p_parametros.campos.hasta_maquina || null,
        'desde_maquina': p_parametros.campos.desde_maquina || null,
        'hasta_orden_fabricacion': p_parametros.campos.hasta_orden_fabricacion || null,
        'desde_orden_fabricacion': p_parametros.campos.desde_orden_fabricacion || null,
        'fecha_fin_prevista': p_parametros.campos.fecha_fin_prevista || null,
        'fecha_ini_prevista': p_parametros.campos.fecha_ini_prevista || null,
        'desde_seccion': p_parametros.campos.desde_seccion || null,
        'hasta_seccion': p_parametros.campos.hasta_seccion || null,
        'desde_tipo_maquina': p_parametros.campos.desde_tipo_maquina || null,
        'hasta_tipo_maquina': p_parametros.campos.hasta_tipo_maquina || null,
      };

      app.fn.ajax(app.opts.api + app.opts.modulo + '/get_data', v_param, function(data) {

        /*var dataString = JSON.stringify(data.tareas);
        console.log('TAREAS: ' + dataString);

        var dataRec = JSON.stringify(data.recursos);
        console.log('RECURSOS: ' + dataRec);*/

        app.fn.activar_region(app.tpl.region.r_gantt, {clases: 'flexbox', footer: false, callback: function() {
          app.fn.ejecutar_plugin('gantt_movilidad', function() {

            app.gantt = new app.ob.gantt_movilidad();

            var v_data_gantt = data.tareas;

            var v_data_recursos = data.recursos;

            app.gantt.inicializar(app, {
              'dom': {
                'wrapper': '#r_gantt'
              },
              'eventos': {
                'pulsar_tarea': function(p_parametros) { 
                  console.log(p_parametros);
                },
                'actualizar_tarea': function(p_parametros) {
                  console.log(p_parametros);

                  console.log('id: ' + p_parametros.task.id + ' fecha_inicio: ' + p_parametros.task.fecha_inicio + ' fecha_fin: ' + p_parametros.task.fecha_fin + ' progress: ' + p_parametros.task.progress);
                  var v_parametres = {
                    /*'empresa': p_parametros.task.empresa,
                    'plataforma': p_parametros.task.plataforma,
                    'orden_de_fabricacion': p_parametros.task.orden_de_fabricacion,
                    'secuencia': p_parametros.task.secuencia,

                    'fecha_inicio': p_parametros.task.fecha_inicio,
                    'cambio_recurso': false,
                    'desde_proyecto': p_parametros.task.desde_proyecto,
                    'hasta_proyecto': p_parametros.task.hasta_proyecto,
                    'desde_maquina': p_parametros.task.desde_maquina,
                    'hasta_maquina': p_parametros.task.hasta_maquina,
                    'desde_of': p_parametros.task.desde_orden_fabricacion,
                    'hasta_of': p_parametros.task.hasta_orden_fabricacion,
                    'desde_fecha_aux': p_parametros.task.desde_fecha_aux,
                    'hasta_fecha_aux': p_parametros.task.hasta_fecha_aux,
                    'desde_seccion': p_parametros.task.desde_seccion,
                    'hasta_seccion': p_parametros.task.hasta_seccion,
                    'desde_tipo_maquina': p_parametros.task.desde_tipo_maquina,
                    'hasta_tipo_maquina': p_parametros.task.hasta_tipo_maquina,
                    'recalcular_al_mover': true*/
                  };

                  app.fn.ajax(app.opts.api + app.opts.modulo + '/actualizar_datos_tarea', v_parametres, function(result) {
                    console.log(result.resultado);
                  });
                }
              },
              'recursos': {
                'activo': true,
                'datos': v_data_recursos
              },
            }, function() {
      
              app.gantt.cargar_datos_gantt( v_data_gantt );
      
            });
          
          }, 'files/assets/ob/gantt_movilidad', app.ob);
        
        }});

      });

    };
    return app;
  
  });
  