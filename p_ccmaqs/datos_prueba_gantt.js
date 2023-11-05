app.fn.activar_region(app.tpl.region.r_gantt, {clases: 'flexbox', footer: false, callback: function() {
    app.fn.ejecutar_plugin('gantt_movilidad', function() {
      app.gantt = new app.ob.gantt_movilidad();
      var v_data_gantt = {
        "data":[
          {
            "id": 1,
            "text": "PROYECTO",
            "type": "project",
            "start_date": "2024-04-02 00:00"
          },
          {
            "id": 2,
            "text": "Tarea 1",
            "type": "task",
            "start_date": "2024-04-03 00:00",
            "duration": 7,
            "parent": 1,
            "progress": 0.6,
            "owner": [
              {"resource_id": "1", "value": 2},
              {"resource_id": "2", "value": 5}
            ],
            "priority": 1,
            "planned_start": "2024-04-03 00:00",
            "planned_end": "2024-04-12 00:00"
          },
          {
            "id": 3,
            "text": "Tarea (Solo Lectura)",
            "type": "task",
            "start_date": "2024-04-08 00:00",
            "end_date": "2024-04-15 00:00",
            "parent": 1,
            "progress": 0,
            "owner": [
              { "resource_id": "1", "value": 2 }
            ],
            "readonly": true
          },
          {
            "id": 4,
            "text": "EJEMPLO DE FASE",
            "type": "fase",
            "start_date": "2024-04-05 00:00",
            "end_date": "2024-04-08 00:00",
            "parent": 1,
            "open": false,
            "datos": {"rowid": 1111, "valor": "X"}
          },
          {
            "id": 5,
            "text": "Tarea de la Fase",
            "type": "task",
            "start_date": "2024-04-07 00:00",
            "duration": 1,
            "parent": 4,
            "progress": 0.75,
            "owner": [
              { "resource_id": "2", "value": 1 }
            ]
          }
        ],
        "links": [
          {"id": 1, "source": 2, "target": 3, "type": "0"},
        ]
      };

      var v_data_recursos = [
        {"id": "1", "text": "Recurso 1"},
        {"id": "2", "text": "Recurso 2"}
      ];

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




  /*
      app.fn.ajax(app.opts.api + app.opts.modulo + '/get_data_tarea', v_param, function(result_data) {
        console.log('Primera tasca id ' + result_data.data[0].start_date + ' ' + result_data.data[0].end_date);
        var result_dataString = JSON.stringify(result_data);
        console.log('TAREAS: ' + result_dataString);

        app.fn.ajax(app.opts.api + app.opts.modulo + '/get_data_recurso', v_param, function(result_recurso) {
          var result_recurso_string = JSON.stringify(result_recurso);
          console.log('RECURSOS: ' + result_recurso_string);

          app.fn.activar_region(app.tpl.region.r_gantt, {clases: 'flexbox', footer: false, callback: function() {
            app.fn.ejecutar_plugin('gantt_movilidad', function() {
              app.gantt = new app.ob.gantt_movilidad();
              var v_data_gantt = result_data;
    
              var v_data_recursos = [
                result_recurso.data
              ];
              /*var v_data_recursos = [
                {"id": "70/1: 300001", "text": "MEZCLADORA 1"}
              ];
    
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
                  }
                },
                'recursos': {
                  'activo': true,
                  'datos': v_data_recursos
                },
              }, function() {
        
                app.gantt.cargar_datos_gantt(v_data_gantt);
        
              });
            
            }, 'files/assets/ob/gantt_movilidad', app.ob);
          
          }});

        });

      });*/