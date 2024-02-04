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
  var unsavedChanges = false;
  app.fn.cargar_opciones({
    //
  }, o);
  app.regiones = ['r_campos', 'r_gantt', 'r_datos_tarea'];
  /**
   * Funcion inicial
   * @param {Object} data Objeto con los datos del ERP
   * @memberof p_ccmaqs
  */
  app.fn.inicio = function(data) {
    app.fn.generar_boton_nav('nav', 'help', 'icon-info-circle', app.opts.lang.informacion, function() {
      alert('EDISA');
    });
    app.fn.generar_boton_nav('nav', 'regresar', 'icon-angle-double-left', app.opts.lang.regresar, function() {
      if (unsavedChanges) {
        var unsavedChangesEvent = new Event('beforeunload');
        window.dispatchEvent(unsavedChangesEvent);
      }
      app.fn.mostrar_campos();
    });
    // Botón de guardar
    app.fn.generar_boton_nav('nav', 'guardar', 'icon-save', app.opts.lang.guardar, function() {
      // crida a guardar de les dades de sch_grafico_proyectos a sch_of_rutas
      msg.ask(app.opts.lang.msg_grabar_modificaciones, function(val) {
        if(val === 'Y') {
          unsavedChanges = false;
          console.log('guardar datos');
          app.fn.ajax(app.opts.api + app.opts.modulo + '/guardar_datos_grafico', function(data) {
            console.log(data.resultado);
            if (data.resultado !== "OK") {
              msg.alert(data.resultado);
            }
          });
        }
      }, {
        'title': app.opts.lang.mensaje, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar
      });
    });
    app.fn.mostrar_campos();
  };
  window.addEventListener("beforeunload", function (e) {
    // Check if there are unsaved changes
    if (unsavedChanges) {
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    }
  });
  /**
   * Mostrar Bloque de Campos
   * @memberof p_ccmaqs
   */
  app.fn.mostrar_campos = function() {
    app.fn.activar_region(app.tpl.region.r_campos, {vaciar: true, footer: false, modal: false, callback: function() {
      app.tpl.nav.help.show();
      app.tpl.nav.guardar.hide();
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
            //console.log(data);
            if (data.resultado === "1") {
              console.log("Sobreescribir");
              msg.ask(app.opts.lang.msg_sobreescribir_simulacion, function(val) {
                if(val === 'Y') {
                  console.log('parametres1: ', v_campos.planta_productiva, ' ', v_campos.codigo_simulacion, ' ', v_campos.desde_orden_fabricacion || null, ' ', v_campos.hasta_orden_fabricacion || null);
                  app.fn.ajax(app.opts.api + app.opts.modulo + '/rehacer_tablas', v_param, function(data) {
                    console.log(data);
                    app.fn.mostrar_gantt({'campos': v_campos});
                  });
                }
              }, {
                'title': app.opts.lang.gantt, 'btnYesText': app.opts.lang.aceptar, 'btnNoText': app.opts.lang.cancelar
              });
            } else {
              // console.log("No sobreescribir");
              //console.log(v_param);
              app.fn.ajax(app.opts.api + app.opts.modulo + '/rehacer_tablas', v_param, function(data) {
                console.log(data);
                app.fn.mostrar_gantt({'campos': v_campos});
              });
            }
          });
        }).appendTo(v_btn_wrapper);
      });
    }});
  };
  function esTareaDentroHorarioLaborable(fecha, horarioLaborable, diasSemana) {
    //var diasSemana = [1, 1, 1, 1, 1, 0, 0]; // 1: dia laborable, 0: dia no laborable (Lunes a Viernes)
    // mira qué día de la semana es la fecha (0: Lunes .. 6: Domingo)
    var dayIndex = fecha.getDay() - 1;
    // Evita que Domingo sea el primero de la semana a la manera americana
    if (dayIndex === -1) {
      dayIndex = 6;
    }
    // Comprueba que el día de la semana sea laborable
    if (diasSemana[dayIndex] === 1) { // 1: dia laborable
      // comprueba que la fecha de inicio de la tarea esté dentro del horario laborable
      var dateTime = new Date(fecha);
      var time = dateTime.toTimeString().split(' ')[0];
      var [startTime, endTime] = horarioLaborable.split('-');
      var startDate = new Date('1970-01-01T' + startTime);
      var endDate = new Date('1970-01-01T' + endTime);
      var targetDate = new Date('1970-01-01T' + time);
      //console.log('startDate: ' + startDate);
      //console.log('endDate: ' + endDate);
      //console.log('targetDate: ' + targetDate);
      // comprueba que la fecha de inicio de la tarea esté dentro de la jornada laborable
      if (targetDate >= startDate && targetDate <= endDate) { // hora laborable
        return true;
      } else { // hora no laborable
        console.log('HORA NO LABORABLE');
        return false;
      }
    } else { // 0: dia no laborable
      console.log('DIA NO LABORABLE');
      return false;
    }
  }
  function formatTime(time) {
    // Añade un 0 a la cadena de carácteres si la hora es de dígito único (ej., '8:45' pasa a ser '08:45')
    if (time.length < 5) {
        time = '0' + time;
    }
    return time;
  }
  function isValidTime(time) {
    // Mira si el campo introducido es una hora válida (ej., '8:45' o '21:34' son válidos, '8:5' no lo es)
    const timeRegex = /^([0-9]|1\d|2[0-3]):[0-5]\d$/;
    return timeRegex.test(time);
  }
  function areTasksOverlapping(p_parametros) {
    // Mira si hay solapamiento entre las tareas
    if (p_parametros.tareas.length <= 1) {
        return false; // No hay solapamiento si solo hay una tarea
    }
    var v_tareas = p_parametros.tareas;
    v_tareas.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    //console.log(v_tareas);
    for (let i = 0; i < v_tareas.length - 1; i++) {
        const currentTask = v_tareas[i];
        const nextTask = v_tareas[i + 1];
        if (new Date(currentTask.end_date) > new Date(nextTask.start_date)) {
            return true; // Solapamiento encontrado
        }
    }
    return false; // No hay solapamiento entre las tareas
  }
  function findSourceEndDateById(array, data, id) {
    // Find the object where the id matches the target
    const item = array.find(obj => obj.target === id);
    // If an item is found, return the source, otherwise return null or undefined
    var idSource = item ? item.source : null;
    //console.log(idSource);
    //console.log(data);
    const taskSource = data.find(item => item.id === idSource);
    var endDateSource = taskSource ? taskSource.end_date : null;
    return endDateSource;
  }
  /**
   * Mostrar gráfico Gantt
   * @param {Object} p_parametros Objeto con los parámetros de la consulta
   */
  app.fn.mostrar_gantt = function(p_parametros) {
    var v_param_turno = {
      'codigo_org_planta': p_parametros.campos.planta_productiva,
    };
    app.fn.ajax(app.opts.api + app.opts.modulo + '/get_hora_turno', v_param_turno, function(dataTurno) {
      var timeParts = dataTurno.resultado.split("-");
      var startTime = timeParts[0].substring(0, 5);
      var endTime = timeParts[1].substring(0, 5);
      var horarioLaborable = startTime + "-" + endTime;
      app.fn.ajax(app.opts.api + app.opts.modulo + '/get_dias_semana_turno', v_param_turno, function(dataDias) {
        var resultArray = dataDias.resultado.split("-");
        var diasSemana = resultArray.map(function(value) {
          // Replace "LB" with 1 and "FO" with 0
          return value === "LB" ? 1 : 0;
        });
        console.log(diasSemana);
        var v_param = {
          'codigo_org_planta': p_parametros.campos.planta_productiva,
          'numero_simulacion': p_parametros.campos.codigo_simulacion,
          'fecha_fin_prevista': p_parametros.campos.fecha_fin_prevista || null,
          'fecha_ini_prevista': p_parametros.campos.fecha_ini_prevista || null
        };
        console.log('PARAMETROS');
        console.log(v_param);
        app.fn.ajax(app.opts.api + app.opts.modulo + '/get_data', v_param, function(data) {
          /*console.log('DATA: ' + data);
          var dataString = JSON.stringify(data.tareas);
          console.log('TAREAS: ' + dataString);
          var dataRec = JSON.stringify(data.recursos);
          console.log('RECURSOS: ' + dataRec);*/
          //console.log('DATA');
          //console.log(data);
          //console.log(data.tareas.data[0].end_date);
          let idEndDateMap = new Map(data.tareas.data.map(obj => [obj.id, obj.end_date]));
          //console.log(idEndDateMap);
          app.fn.activar_region(app.tpl.region.r_gantt, {clases: 'flexbox', footer: false, callback: function() {
            app.tpl.nav.guardar.show();
            app.tpl.nav.regresar.hide();
            app.fn.ejecutar_plugin('gantt_movilidad', function() {
              app.gantt = new app.ob.gantt_movilidad();
              var v_data_gantt = data.tareas;
              var v_data_recursos = data.recursos;
              console.log('RECURSOS GANTT');
              console.log(v_data_recursos);
              app.gantt.inicializar(app, {
                'dom': {
                  'wrapper': '#r_gantt'
                },
                'eventos': {
                  'validar_horario_tarea': function(p_parametros_out) {
                    console.log('validar_horario_tarea');
                    console.log(p_parametros_out);
                    return esTareaDentroHorarioLaborable(p_parametros_out.task.start_date, horarioLaborable, diasSemana);
                  },
                  'pulsar_tarea': function(p_parametros_out) {
                    console.log('pulsar_tarea');
                    console.log(p_parametros_out);
                    //var v_tiene_link = tieneLink(p_parametros_out, data.tareas.links);
                    //console.log(v_tiene_link);
                    var v_sourceEndDate = findSourceEndDateById(data.tareas.links, data.tareas.data, p_parametros_out.task.id);
                    //console.log(v_sourceEndDate);
                    app.fn.mostrar_datos_tarea(p_parametros_out.task.id, horarioLaborable, diasSemana, v_sourceEndDate);
                  },
                  'arrastrar_tarea': function(p_parametros_out) {
                    console.log('arrastrar_tarea');
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
                      'fecha_inicio': p_parametros_out.task.fecha_inicio || null,
                      'fecha_fin': p_parametros_out.task.fecha_fin || null
                    };
                    //console.log(v_parametres);
                    //console.log(p_parametros_out.task.fecha_inicio + ' ' + p_parametros_out.task.fecha_fin);
                    app.fn.ajax(app.opts.api + app.opts.modulo + '/actualizar_datos_tarea_con_fecha_fin', v_parametres, function(result) {
                      console.log(result);
                      unsavedChanges = true;
                    });
                    // mirar si tiene enlaces y actualizar las fechas de las tareas enlazadas
                    if (data.tareas.links.length !== 0) {
                      var targetValue = -1;
                      for (let i = 0; i < data.tareas.links.length; i++) {
                        if (data.tareas.links[i].source === p_parametros_out.task.id) {
                          targetValue = data.tareas.links[i].target;
                          console.log('targetValue: ' + targetValue);
                          break;
                        }
                      }
                      if (targetValue !== -1) {
                        // encontrar end_date de la tarea con id p_parametros_out.task.id
                        var iniTargetDate = '';
                        var endTargetDate = '';
                        //var idTarget = 0;
                        // encontrar fecha_inicio de la tarea target
                        for (let i = 0; i < data.tareas.data.length; i++) {
                          if (data.tareas.data[i].id === targetValue) {
                            //idTarget = data.tareas.data[i].id;
                            iniTargetDate = data.tareas.data[i].start_date;
                            endTargetDate = data.tareas.data[i].end_date;
                            textTarget = data.tareas.data[i].text;
                            console.log('textTarget: ' + textTarget);
                            console.log(iniTargetDate);
                            console.log(endTargetDate);
                            break;
                          }
                        }
                        let IniInputDate = new Date(iniTargetDate);
                        let EndInputDate = new Date(endTargetDate);
                        let padZero = (num) => (num < 10 ? `0${num}` : num);
                        let iniFormattedDate = `${padZero(IniInputDate.getDate())}/${padZero(IniInputDate.getMonth() + 1)}/${IniInputDate.getFullYear()} ${padZero(IniInputDate.getHours())}:${padZero(IniInputDate.getMinutes())}:${padZero(IniInputDate.getSeconds())}`;
                        let endFormattedDate = `${padZero(EndInputDate.getDate())}/${padZero(EndInputDate.getMonth() + 1)}/${EndInputDate.getFullYear()} ${padZero(EndInputDate.getHours())}:${padZero(EndInputDate.getMinutes())}:${padZero(EndInputDate.getSeconds())}`;
                        var partsTarget = textTarget.split('/');
                        var v_orden_de_fabricacion_target = parseInt(partsTarget[0], 10);
                        var v_secuencia_target = parseInt(partsTarget[1], 10);
                        var v_parametres_enlazado = {
                          'planta': p_parametros.campos.planta_productiva,
                          'simulacion': p_parametros.campos.codigo_simulacion,
                          'orden_de_fabricacion': v_orden_de_fabricacion_target,
                          'secuencia': v_secuencia_target,
                          'fecha_inicio': iniFormattedDate || null,
                          'fecha_fin': endFormattedDate || null
                        };
                        console.log(v_parametres_enlazado);
                        app.fn.ajax(app.opts.api + app.opts.modulo + '/actualizar_datos_tarea_con_fecha_fin', v_parametres_enlazado, function(result) {
                          console.log(result);
                          unsavedChanges = true;
                        });
                      }
                    }
                  },
                  'clase_css_celda_recurso': function(p_parametros) {
                    //console.log('CLASE_CSS_CELDA_RECURSO', p_parametros);
                    var css = [];
                    css.push("resource_marker");
                    if (areTasksOverlapping(p_parametros)) {
                      css.push("workday_over");
                    } else {
                      css.push("workday_ok");
                    };
                    return css.join(" ");
                  }
                },
                'recursos': {
                  'activo': true,
                  'datos': v_data_recursos,
                  'usar_colores': true,
                  'formato_celda': {
                    'modo_calculo': 'tareas',
                    'mostrar_valor': false
                  }
                },
                'redondear_fechas_a_escala': false,
                'permitir_redimensionar_tareas': false,
                //'filtrar_horario_trabajo': 'S',
                'permitir_modificar_progreso': false,
                'permitir_modificar_enlaces': false,
                'unidad_duracion': 'm',
                'calendarios': [{
                  'horas': [horarioLaborable],
                  'dias': {
                    'l': diasSemana[0],
                    'm': diasSemana[1],
                    'x': diasSemana[2],
                    'j': diasSemana[3],
                    'v': diasSemana[4],
                    's': diasSemana[5],
                    'd': diasSemana[6]
                  }
                }],
                'ajuste_automatico_relacionadas': true,
              }, function() {
                app.gantt.cargar_datos_gantt( v_data_gantt );
              });
            }, 'files/assets/ob/gantt_movilidad', app.ob);
          }});
        });
      });
    });
  };
  
  /**
   * Mostrar Bloque de Datos
   * @memberof p_ccmaqs
   */
  app.fn.mostrar_datos_tarea = function(p_id_tarea, horarioLaborable, diasSemana, sourceLinkDate) {
    console.log('entra mostrar_datos_tarea');
    app.fn.activar_region(app.tpl.region.r_datos_tarea, { modal: true, callback: function() {
      app.fn.generar_bloque('datos_tarea', app.tpl.region.r_datos_tarea, { valores: {'id_tarea': p_id_tarea} }, function() {
        var v_btn_wrapper = app.tpl.region.r_datos_tarea.find('.button-contain');
        var v_btn_cancelar = app.fn.genera_boton('btn_cancelar', 'btnblanco', app.opts.lang.cancelar, function() {
          app.fn.desactivar_region_modal(app.tpl.region.r_datos_tarea);
        }).appendTo(v_btn_wrapper);
        var v_btn_actualizar = app.fn.genera_boton('btn_actualizar', 'btnverde', app.opts.lang.actualizar, function() {
          if(!app.fn.validar_formulario(app.tpl.region.r_datos_tarea)) return false;
          var v_datos = app.fn.obtener_valores_form(app.tpl.region.r_datos_tarea);
          // HH25:MI formato de hora
          var timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          // Testea si la cadena proporcionada coincide con el patrón
          var hora_ini_formateada = formatTime(v_datos.hora_ini);
          if (!timeRegex.test(hora_ini_formateada)) return false;
          var fecha_ini_completa = v_datos.fecha_ini + ' ' + hora_ini_formateada + ':00';
          var fecha_fin_completa = v_datos.fecha_fin + ' ' + v_datos.hora_fin + ':00';
          console.log(fecha_ini_completa + ' --- ' + fecha_fin_completa);
          //console.log(v_datos.hora_ini + ' ' + hora_ini_formateada);
          // comprueba que la fecha de inicio de la tarea esté dentro del horario laborable
          var parts = fecha_ini_completa.split(/[\s/:]+/);
          var dateObject = new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5]);
          //console.log(dateObject);
          //console.log(sourceLinkDate);
          //console.log(new Date(fecha_ini_completa));
          var v_esDentroLaborable = esTareaDentroHorarioLaborable(dateObject, horarioLaborable, diasSemana);
          if (!v_esDentroLaborable) {
            msg.alert(app.opts.lang.msg_error_fecha_ini);
            return false;
          } else if (sourceLinkDate !== null && dateObject < sourceLinkDate) {
            msg.alert(app.opts.lang.msg_error_solapacion);
            return false;
          } else {
            var v_tarea = app.gantt.obtener_datos_tarea(parseInt(v_datos.id_tarea));
            var v_duracion = v_tarea.duration;
            console.log('DURACION: ' + v_duracion);
            var v_param = {
              'id_tarea': parseInt(v_datos.id_tarea),
              'fecha_inicio': fecha_ini_completa,
              'fecha_fin': fecha_fin_completa,
              'orden_de_fabricacion': parseInt(v_datos.orden_de_fabricacion),
              'planta': v_datos.codigo_org_planta,
              'secuencia': parseInt(v_datos.secuencia),
              'simulacion': v_datos.numero_simulacion,
              'duracion': v_duracion
            }
            //console.log(v_param);
            app.fn.actualizar_datos_tarea(v_param);
          }
        }).appendTo(v_btn_wrapper);
      });
    }});
  };
 
  /*
  function actualiza_tareas_enlazadas(p_datos_tarea, numero_secuencias_of) {
    var idSecuencia = p_datos_tarea.id_tarea;
    var i_secuencia = p_datos_tarea.secuencia + 1;
    while (i_secuencia <= numero_secuencias_of) {
      console.log('idSecuencia: ' + idSecuencia);
      console.log('i_secuencia: ' + i_secuencia);
      var p_datos_get_fechas_secuencia = {
        'planta': p_datos_tarea.planta,
        'simulacion': p_datos_tarea.simulacion,
        'orden_de_fabricacion': p_datos_tarea.orden_de_fabricacion,
        'secuencia': i_secuencia
      };
      app.fn.ajax(app.opts.api + app.opts.modulo + '/get_fechas_secuencia', p_datos_get_fechas_secuencia, function(resultado) {
        console.log(resultado);
        if (!app.fn.es_nulo(resultado.resultado) && resultado.resultado !== 'OK') {
          console.log('ERROR');
          // msg.alert(data.mensaje, null, {'btnText': app.opts.lang.aceptar, 'title': app.opts.lang.error});
        } else {
          console.log('OKAY1');
          var v_data_actualizar_secuencia = {
            'id_tarea': idSecuencia,
            'fecha_inicio': resultado.fecha_inicio, 
            'fecha_fin': resultado.fecha_fin,
            'orden_de_fabricacion': p_datos_tarea.orden_de_fabricacion,
            'planta': p_datos_tarea.planta,
            'secuencia': i_secuencia,
            'simulacion': p_datos_tarea.simulacion
          };
          app.gantt.actualizar_datos_tarea(idSecuencia, v_data_actualizar_secuencia);
        }
      });
      idSecuencia--;
      i_secuencia++;
    }
  }*/

  app.fn.actualizar_datos_tarea = function(p_datos_tarea) {
    console.log('ANDREU parametres');
    console.log(p_datos_tarea);
    app.fn.loader(true);
    app.fn.ajax(app.opts.api + app.opts.modulo + '/actualizar_fecha_fin', p_datos_tarea, function(data) {
      console.log(data);
      if (!app.fn.es_nulo(data.resultado) && data.resultado !== 'OK') {
        //cancelamos el proceso porque hubo un error
        app.fn.loader(false);
        console.log('ERROR');
        msg.alert(data.mensaje, null, {'btnText': app.opts.lang.aceptar, 'title': app.opts.lang.error});
      } else {
        app.fn.desactivar_region_modal(app.tpl.region.r_datos_tarea);
        unsavedChanges = true;
        var id = '' + p_datos_tarea.id_tarea;
        //console.log(p_datos_tarea.id_tarea);
        console.log('OK');
        console.log(p_datos_tarea);
        var v_data_actualizar = {
          'id_tarea': p_datos_tarea.id_tarea,
          'fecha_inicio': p_datos_tarea.fecha_inicio,
          'fecha_fin': data.fecha_fin,
          'orden_de_fabricacion': p_datos_tarea.orden_de_fabricacion,
          'planta': p_datos_tarea.planta,
          'secuencia': p_datos_tarea.secuencia,
          'simulacion': p_datos_tarea.simulacion
        }
        app.gantt.actualizar_datos_tarea(id, v_data_actualizar);
        app.fn.loader(false);

        // mirar si tiene enlaces y actualizar las fechas de las tareas enlazadas
        if (data.secuencias.length > 0) {
          for (let i = 0; i < data.secuencias.length; i++) {
            var v_data_actualizar = {
              'id_tarea': data.secuencias.at(i).id,
              'fecha_inicio': data.secuencias.at(i).fecha_ini,
              'fecha_fin': data.secuencias.at(i).fecha_fin,
              'orden_de_fabricacion': p_datos_tarea.orden_de_fabricacion,
              'planta': p_datos_tarea.planta,
              'secuencia': data.secuencias.at(i).secuencia,
              'simulacion': p_datos_tarea.simulacion
            }

            app.gantt.actualizar_datos_tarea(data.secuencias.at(i).id, v_data_actualizar);
          }
        }

        /*
        var p_datos_numero_secuencias_of = {
          'planta': p_datos_tarea.planta,
          'simulacion': p_datos_tarea.simulacion,
          'orden_de_fabricacion': p_datos_tarea.orden_de_fabricacion  
        };
        app.fn.ajax(app.opts.api + app.opts.modulo + '/numero_secuencias_of', p_datos_numero_secuencias_of, function(result) {
          console.log(result);
          if (!app.fn.es_nulo(result.resultado) && result.resultado !== 'OK') {
            console.log('ERROR');
            // msg.alert(data.mensaje, null, {'btnText': app.opts.lang.aceptar, 'title': app.opts.lang.error});
          } else {
            console.log('OKAY');
            console.log(result.numero_secuencias_of);
            if (result.numero_secuencias_of > 1 && result.numero_secuencias_of > p_datos_tarea.secuencia) {
              // actualizar gráfico con los nuevos datos de las secuencias de la orden de fabricación
              actualiza_tareas_enlazadas(p_datos_tarea, result.numero_secuencias_of);
            }
          }
        });
        */
      };
    });
  };
  // funcions públiques
  app.publico.fn.mostrar_gantt = app.fn.mostrar_gantt;
  return app;
});