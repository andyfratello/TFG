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
            if(!app.fn.validar_formulario(app.tpl.region.r_campos)) return false;
            var v_campos = app.fn.obtener_valores_form(app.tpl.region.r_campos);
            var v_param = {
              'codigo_org_planta': v_campos.planta_productiva,
              'numero_simulacion': v_campos.codigo_simulacion,
              'hasta_proyecto': v_campos.hasta_proyecto || null,
              'desde_proyecto': v_campos.desde_proyecto || null,
              'hasta_maquina': v_campos.hasta_maquina || null,
              'desde_maquina': v_campos.desde_maquina || null,
              'hasta_orden_fabricacion': v_campos.hasta_orden_fabricacion || null,
              'desde_orden_fabricacion': v_campos.desde_orden_fabricacion || null,
              'fecha_fin_prevista': v_campos.fecha_fin_prevista || null,
              'fecha_ini_prevista': v_campos.fecha_ini_prevista || null,
              'desde_seccion': v_campos.desde_seccion || null,
              'hasta_seccion': v_campos.hasta_seccion || null,
              'desde_tipo_maquina': v_campos.desde_tipo_maquina || null,
              'hasta_tipo_maquina': v_campos.hasta_tipo_maquina || null
            };

            // mirar si la simulación existe
            app.fn.ajax(app.opts.api + app.opts.modulo + '/es_simulacion_en_uso', v_param, function(data) {
              if (data.resultado === "1") {
                console.log("Sobreescribir");
                msg.ask(app.opts.lang.msg_sobreescribir_simulacion, function(val) { 
                  if(val === 'Y') {
                    console.log('parametres1: ', v_campos.planta_productiva, ' ', v_campos.codigo_simulacion, ' ', v_campos.fecha_inicio || null, ' ', v_campos.fecha_fin || null);
                    app.fn.ajax(app.opts.api + app.opts.modulo + '/rehacer_tablas', v_param, function(data) {
                      console.log(data);
                      app.fn.mostrar_gantt({'campos': v_campos});
                    });
                    
                  }
                }, { 
                  'title': app.opts.lang.gantt, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar 
                });
              } else {
                //if(!app.fn.validar_formulario(app.tpl.region.r_campos)) return false;
                //var v_campos = app.fn.obtener_valores_form(app.tpl.region.r_campos);
                console.log("No sobreescribir");
                console.log('parametres: ', v_campos.planta_productiva, ' ', v_campos.codigo_simulacion, ' ', v_campos.fecha_inicio || null, ' ', v_campos.fecha_fin || null);
                /*app.fn.ajax(app.opts.api + app.opts.modulo + '/rehacer_tablas', v_param, function(data) {
                  console.log(data);
                  app.fn.mostrar_gantt({'campos': v_campos});
                });*/
                app.fn.mostrar_gantt({'campos': v_campos});
              }
            });
            
          }).appendTo(v_btn_wrapper);
            
        });
  
      }});
  
    };


    /*function confirmaSobreescribir(v_campos, v_param) {
      msg.ask(app.opts.lang.msg_sobreescribir_simulacion, function(val) { 
        if(val === 'Y') {
          console.log('parametres1: ', v_campos.planta_productiva, ' ', v_campos.codigo_simulacion, ' ', v_campos.fecha_inicio || null, ' ', v_campos.fecha_fin || null);
          app.fn.ajax(app.opts.api + app.opts.modulo + '/rehacer_tablas', v_param, function(data) {
            console.log(data);
            app.fn.mostrar_gantt({'campos': v_campos});
          });
          
        }
      }, { 
        'title': app.opts.lang.gantt, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar 
      });
    }*/


    /**
     * Mostrar gráfico Gantt
     * @param {Object} p_parametros Objeto con los parámetros de la consulta
     */
    app.fn.mostrar_gantt = function(p_parametros) {
      
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

        /*console.log('DATA: ' + data);
        var dataString = JSON.stringify(data.tareas);
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
                'pulsar_tarea': function(p_parametros_out) { 
                  console.log(p_parametros_out);
                },
                'actualizar_tarea': function(p_parametros_out) {
                  console.log(p_parametros_out);

                  // console.log('id: ' + p_parametros_out.task.id + ' fecha_inicio: ' + p_parametros_out.task.fecha_inicio + ' fecha_fin: ' + p_parametros_out.task.fecha_fin + ' progress: ' + p_parametros_out.task.progress + ' plataforma ' + p_parametros.campos.planta_productiva +  ' simulacion ' + p_parametros.campos.codigo_simulacion);
                  var parts = p_parametros_out.task.text.split('/');
                  var v_orden_de_fabricacion = parseInt(parts[0], 10);
                  var v_secuencia = parseInt(parts[1], 10);
                 
                  var v_parametres = {
                    'planta': p_parametros.campos.planta_productiva,
                    'simulacion': p_parametros.campos.codigo_simulacion,
                    'orden_de_fabricacion': v_orden_de_fabricacion,
                    'secuencia': v_secuencia,
                    'fecha_inicio': p_parametros_out.task.fecha_inicio || null
                    /*'cambio_recurso': false,
                    'desde_proyecto': p_parametros.campos.desde_proyecto || null,
                    'hasta_proyecto': p_parametros.campos.hasta_proyecto || null,
                    'desde_maquina': p_parametros.campos.desde_maquina || null,
                    'hasta_maquina': p_parametros.campos.hasta_maquina || null,
                    'desde_of': p_parametros.campos.desde_orden_fabricacion || null,
                    'hasta_of': p_parametros.campos.hasta_orden_fabricacion || null,
                    'desde_fecha_aux': p_parametros.campos.desde_fecha_aux || null,
                    'hasta_fecha_aux': p_parametros.campos.hasta_fecha_aux || null,
                    'desde_seccion': p_parametros.campos.desde_seccion || null,
                    'hasta_seccion': p_parametros.campos.hasta_seccion || null,
                    'desde_tipo_maquina': p_parametros.campos.desde_tipo_maquina || null,
                    'hasta_tipo_maquina': p_parametros.campos.hasta_tipo_maquina || null,
                    'recalcular_al_mover': false*/
                  };
                  console.log(v_parametres);

                  app.fn.ajax(app.opts.api + app.opts.modulo + '/actualizar_datos_tarea', v_parametres, function(result) {
                    console.log(result);
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
  