CREATE OR REPLACE PACKAGE pk_web_p_ccmaqs AS
  /* pk_web_p_ccmaqs
  * --------------------------------------------------------------------------------------------------
  * Descripción:
  *  Gantt de la Carga de Máquinas
  * --------------------------------------------------------------------------------------------------
  * Version:    2023.10.18
  * --------------------------------------------------------------------------------------------------
  */

  TYPE r_of IS RECORD(
    id_sesion            NUMBER,
    codigo_org_planta    VARCHAR2(5),
    numero_simulacion    VARCHAR2(20),
    orden_de_fabricacion NUMBER(10),
    secuencia            NUMBER(4),
    fase                 NUMBER(3),
    linea                NUMBER(4),
    codigo_articulo      VARCHAR2(30),
    tipo                 VARCHAR2(1),
    fecha_ini            VARCHAR2(20),
    fecha_fin            VARCHAR2(20),
    recurso              VARCHAR2(100),
    desc_recurso         VARCHAR2(500),
    porc_completado      NUMBER(5),
    y                    NUMBER,
    nexttask             NUMBER,
    nextrecurso          VARCHAR2(20),
    recurso_libra        VARCHAR2(40));

  TYPE tt_of IS TABLE OF r_of INDEX BY BINARY_INTEGER;
    
  TYPE r_recurso IS RECORD(
    recurso_libra        VARCHAR2(40),
    desc_recurso         VARCHAR2(500));

  TYPE tt_recurso IS TABLE OF r_recurso INDEX BY BINARY_INTEGER;

  TYPE task_details_type IS RECORD(
    orden_de_fabricacion NUMBER(10),
    secuencia            NUMBER(4),
    codigo_org_planta    VARCHAR2(5),
    numero_simulacion    VARCHAR2(20),
    fecha_ini            VARCHAR2(20),
    hora_ini             VARCHAR2(8),
    fecha_fin            VARCHAR2(20),
    hora_fin             VARCHAR2(8),
    codigo_articulo      VARCHAR2(30),
    desc_articulo        VARCHAR2(500),
    desc_recurso         VARCHAR2(500),
    cant_aceptada        NUMBER(19,4),
    cant_a_fabricar      NUMBER(19,4),
    fase                 NUMBER(3));

  TYPE r_turnos IS RECORD(
    hora_ini_turno DATE,
    hora_fin_turno DATE);

  TYPE r_dias_semana IS RECORD(
    lunes     VARCHAR2(2),
    martes    VARCHAR2(2),
    miercoles VARCHAR2(2),
    jueves    VARCHAR2(2),
    viernes   VARCHAR2(2),
    sabado    VARCHAR2(2),
    domingo   VARCHAR2(2));
    
  TYPE r_fecha_record_type IS RECORD (
    fecha_ini DATE,
    fecha_fin DATE);
    
  TYPE t_registro_fecha IS RECORD (
    secuencia NUMBER,
    fecha_ini VARCHAR2(30),
    fecha_fin VARCHAR2(30),
    y NUMBER);

  TYPE t_array_fecha IS TABLE OF t_registro_fecha INDEX BY BINARY_INTEGER;


  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2) RETURN tt_of;

  PROCEDURE rehacer_tablas(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                           p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, /* p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2, */ p_desde_seccion VARCHAR2,
                           p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2);

  FUNCTION get_recursos_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN tt_recurso;

  FUNCTION numero_secuencias_of(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER) RETURN NUMBER;

  FUNCTION actualizar_datos_tarea_con_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2, p_fecha_fin VARCHAR2) RETURN VARCHAR2;

  FUNCTION actualizar_datos_tarea(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2) RETURN VARCHAR2;

  FUNCTION es_simulacion_en_uso(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2) RETURN NUMBER;

  PROCEDURE guardar_datos_grafico;

  FUNCTION get_task_details(p_id_tarea IN NUMBER) RETURN task_details_type;

  FUNCTION get_hora_turno(p_codigo_org_planta VARCHAR2, p_empresa VARCHAR2) RETURN r_turnos;

  FUNCTION get_dias_semana_turno(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN r_dias_semana;
  
  FUNCTION es_dia_laborable(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_date DATE) RETURN VARCHAR2;
  
  PROCEDURE adaptar_tareas_a_calendario(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_ini DATE, p_fecha_fin DATE);

  FUNCTION devuelve_fecha_fin_calendario(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fin DATE) RETURN VARCHAR2;
  
  FUNCTION es_fecha_laborable(p_fecha DATE, p_ini_turno VARCHAR2, p_fin_turno VARCHAR2, p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN BOOLEAN;
  
  FUNCTION devuelve_fechas_iniciales(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN r_fecha_record_type;
  
  FUNCTION actualizar_ofs_enlazadas(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, v_counter_ofs NUMBER, p_duracion NUMBER) RETURN VARCHAR2;
  
  FUNCTION obtiene_tiempo_no_laboral(p_empresa VARCHAR2, p_planta VARCHAR2, p_f_ini DATE, p_turno_ini DATE, p_turno_fin DATE) RETURN NUMBER;
  
  FUNCTION calcula_nueva_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio DATE, p_duracion NUMBER) RETURN VARCHAR2;
  
  FUNCTION hay_colisiones(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_fin VARCHAR2) RETURN BOOLEAN;
  
  FUNCTION suma_duracion_laborable(p_fecha_inicio DATE, p_turno_ini NUMBER, p_turno_fin NUMBER, duration_hours NUMBER, p_empresa VARCHAR2, p_planta VARCHAR2) RETURN DATE;
  
  FUNCTION convierte_hora_a_decimal(p_hora VARCHAR2) RETURN NUMBER;
  
  FUNCTION convierte_decimal_a_hora(p_hora_decimal NUMBER) RETURN VARCHAR2;
  
  FUNCTION calcula_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_fecha_inicio DATE, p_duracion NUMBER) RETURN VARCHAR2;
  
  FUNCTION actualizar_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio DATE, p_duracion NUMBER) RETURN VARCHAR2;

  FUNCTION get_fechas_secuencia(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN VARCHAR2;

END pk_web_p_ccmaqs;
/
CREATE OR REPLACE PACKAGE BODY pk_web_p_ccmaqs AS

  -- crea una colección a partir de la tabla de OFs. Con estos datos se dibuja el gráfico
  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2) RETURN tt_of IS
    mytable       tt_of;
    v_fecha_hasta DATE := TO_DATE(p_fecha_fabricacion_hasta, 'DD/MM/YYYY');
    v_fecha_desde DATE := TO_DATE(p_fecha_fabricacion_desde, 'DD/MM/YYYY');
  BEGIN
  
    --pkpantallas.log('ANDREU: get_ofs_graph2: ' || v_fecha_hasta || ' ' || v_fecha_desde);
  
    FOR c IN (SELECT c.id_sesion, c.codigo_org_planta, c.numero_simulacion, c.orden_de_fabricacion, c.secuencia, c.fase, c.linea, c.codigo_articulo, c.tipo,
                     TO_CHAR(c.fecha_ini, 'YYYY-MM-DD HH24:MI') AS fecha_ini, TO_CHAR(c.fecha_fin, 'YYYY-MM-DD HH24:MI') AS fecha_fin, c.recurso, c.desc_recurso, c.porc_completado, c.y, c.nexttask,
                     c.nextrecurso, c.recurso_libra
                FROM sch_grafico_proyectos c
               WHERE c.codigo_org_planta = p_codigo_org_planta
                 AND c.numero_simulacion = p_codigo_simulacion
            ORDER BY c.orden_de_fabricacion, c.secuencia) LOOP
    
      -- Check if v_fecha_hasta and v_fecha_desde are not null
      IF (v_fecha_hasta IS NOT NULL AND v_fecha_desde IS NOT NULL) THEN
        --pkpantallas.log('ANDREU: get_ofs_graph2: ' || v_fecha_hasta || ' ' || v_fecha_desde || ' dates taula: ' || c.fecha_fin || ' ' || c.fecha_ini);
        -- Check if the fecha_ini is within the date range
        IF (c.fecha_ini >= TO_CHAR(v_fecha_desde, 'YYYY-MM-DD HH24:MI') AND c.fecha_ini <= TO_CHAR(v_fecha_hasta, 'YYYY-MM-DD HH24:MI')) THEN
          mytable(mytable.count + 1) := pk_web_p_ccmaqs.r_of(c.id_sesion, c.codigo_org_planta, c.numero_simulacion, c.orden_de_fabricacion, c.secuencia, c.fase, c.linea, c.codigo_articulo, c.tipo,
                                                             c.fecha_ini, c.fecha_fin, c.recurso, c.desc_recurso, c.porc_completado, c.y, c.nexttask, c.nextrecurso, c.recurso_libra);
        END IF;
      
        -- Check if v_fecha_hasta is null (all dates before or equal to v_fecha_desde)
      ELSIF (v_fecha_desde IS NOT NULL) THEN
        IF (c.fecha_ini >= TO_CHAR(v_fecha_desde, 'YYYY-MM-DD HH24:MI')) THEN
          mytable(mytable.count + 1) := pk_web_p_ccmaqs.r_of(c.id_sesion, c.codigo_org_planta, c.numero_simulacion, c.orden_de_fabricacion, c.secuencia, c.fase, c.linea, c.codigo_articulo, c.tipo,
                                                             c.fecha_ini, c.fecha_fin, c.recurso, c.desc_recurso, c.porc_completado, c.y, c.nexttask, c.nextrecurso, c.recurso_libra);
        END IF;
      
        -- Check if v_fecha_desde is null (all dates after or equal to v_fecha_hasta)
      ELSIF (v_fecha_hasta IS NOT NULL) THEN
        IF (c.fecha_ini <= TO_CHAR(v_fecha_hasta, 'YYYY-MM-DD HH24:MI')) THEN
          mytable(mytable.count + 1) := pk_web_p_ccmaqs.r_of(c.id_sesion, c.codigo_org_planta, c.numero_simulacion, c.orden_de_fabricacion, c.secuencia, c.fase, c.linea, c.codigo_articulo, c.tipo,
                                                             c.fecha_ini, c.fecha_fin, c.recurso, c.desc_recurso, c.porc_completado, c.y, c.nexttask, c.nextrecurso, c.recurso_libra);
        END IF;
      
        -- Check if both v_fecha_hasta and v_fecha_desde are null (no date filtering)
      ELSE
       -- pkpantallas.log('ANDREU: get_ofs_graph1: ' || c.fecha_ini || ' ' || c.fecha_fin);
      
        mytable(mytable.count + 1) := pk_web_p_ccmaqs.r_of(c.id_sesion, c.codigo_org_planta, c.numero_simulacion, c.orden_de_fabricacion, c.secuencia, c.fase, c.linea, c.codigo_articulo, c.tipo,
                                                           c.fecha_ini, c.fecha_fin, c.recurso, c.desc_recurso, c.porc_completado, c.y, c.nexttask, c.nextrecurso, c.recurso_libra);
      END IF;
    
    END LOOP;
  
    RETURN mytable;
  
  END get_ofs_graph;

  -- borra y rehace las tablas a partir de los datos al lanzar el gráfico
  PROCEDURE rehacer_tablas(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                           p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, /*p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2, */ p_desde_seccion VARCHAR2,
                           p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) IS
    v_id_sesion NUMBER;
    v_count     NUMBER;
  
    CURSOR c_proyectos IS
      SELECT orden_de_fabricacion, secuencia, fecha_ini, fecha_fin
        FROM sch_grafico_proyectos
       WHERE codigo_empresa = p_codigo_empresa
         AND codigo_org_planta = p_codigo_org_planta
         AND numero_simulacion = p_codigo_simulacion;
  BEGIN
  
    SELECT COUNT(*)
      INTO v_count
      FROM sch_grafico_proyectos
     WHERE numero_simulacion = p_codigo_simulacion;
    IF v_count > 0 THEN
      SELECT DISTINCT (id_sesion)
        INTO v_id_sesion
        FROM sch_grafico_proyectos
       WHERE numero_simulacion = p_codigo_simulacion;
    END IF;
  
    DELETE FROM sch_grafico_recursos
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_codigo_simulacion
       AND id_sesion = v_id_sesion;
  
    DELETE FROM sch_grafico_proyectos
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_codigo_simulacion
       AND id_sesion = v_id_sesion;
  
    DELETE FROM sch_grafico_carga_recursos
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND codigo_simulacion = p_codigo_simulacion
       AND id_sesion = v_id_sesion;
  
    DELETE FROM sch_recursos
     WHERE id_sesion = v_id_sesion;
  
    SELECT smproductsequence.nextval
      INTO v_id_sesion
      FROM dual;
  
    sch_carga_maquinas.prepara_grafico(p_codigo_simulacion, p_codigo_org_planta, p_codigo_empresa, p_hasta_proyecto, p_desde_proyecto, p_maquina_hasta, p_maquina_desde, p_of_hasta, p_of_desde, NULL,
                                       NULL, v_id_sesion, p_desde_seccion, p_hasta_seccion, p_desde_tipo_maquina, p_hasta_tipo_maquina);
  
    sch_carga_maquinas.calcula_carga_maquinas(p_codigo_empresa, p_codigo_org_planta, p_codigo_simulacion, v_id_sesion);
  
    COMMIT;
  
    FOR proj IN c_proyectos LOOP
      pk_web_p_ccmaqs.adaptar_tareas_a_calendario(p_codigo_empresa, p_codigo_org_planta, p_codigo_simulacion, proj.orden_de_fabricacion, proj.secuencia, proj.fecha_ini, proj.fecha_fin);
    END LOOP;
  END rehacer_tablas;

  -- devuelve los datos de los recursos en una colección
  FUNCTION get_recursos_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN tt_recurso IS
    mytable tt_recurso := tt_recurso();
  BEGIN
    FOR c IN (SELECT c.recurso_libra, c.desc_recurso
                FROM sch_grafico_recursos c
               WHERE c.codigo_org_planta = p_codigo_org_planta
                 AND c.numero_simulacion = p_codigo_simulacion
                 GROUP BY c.recurso_libra, c.desc_recurso) LOOP
      mytable(mytable.count + 1) := r_recurso(c.recurso_libra, c.desc_recurso);
    END LOOP;
  
    RETURN mytable;
  END get_recursos_graph;

  -- actualiza datos al mover una tarea afectando directamente sobre la tabla y cambiando fecha_fin y ini
  FUNCTION actualizar_datos_tarea_con_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2,
                                                p_fecha_fin VARCHAR2) RETURN VARCHAR2 IS
    v_result VARCHAR2(50);
  
  BEGIN
    UPDATE sch_grafico_proyectos
       SET fecha_ini = TO_DATE(p_fecha_inicio, 'DD/MM/YYYY HH24:MI:SS'),
           fecha_fin = TO_DATE(p_fecha_fin, 'DD/MM/YYYY HH24:MI:SS')
     WHERE codigo_empresa = p_empresa
       AND codigo_org_planta = p_planta
       AND numero_simulacion = p_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND secuencia = p_secuencia;
  
    COMMIT;
    
    v_result := p_fecha_fin;
    
    RETURN v_result;
  END actualizar_datos_tarea_con_fecha_fin;

  -- actualiza datos al mover una tarea
  FUNCTION actualizar_datos_tarea(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2) RETURN VARCHAR2 IS
    v_result       VARCHAR2(50);
    v_fecha_inicio VARCHAR2(50);
    v_fecha_fin    DATE;
  
  BEGIN
    v_fecha_inicio := TO_CHAR(TO_DATE(p_fecha_inicio, 'DD/MM/YYYY HH24:MI:SS'), 'DDMMYYYYHH24MISS');
  
    --pkpantallas.log('PARAMETROS: v_fecha_inicio: ' || v_fecha_inicio);
  
    v_result := sch_carga_maquinas.calcula_fecha_fin(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, v_fecha_inicio, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
                                                     NULL, NULL, NULL, FALSE);
  
    SELECT fecha_fin
      INTO v_fecha_fin
      FROM sch_grafico_proyectos
     WHERE codigo_empresa = p_empresa
       AND codigo_org_planta = p_planta
       AND numero_simulacion = p_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND secuencia = p_secuencia;
  
    IF v_result IS NULL OR v_result <> '' THEN
      RETURN - 1;
    END IF;
  
    v_result := TO_CHAR(v_fecha_fin, 'DD/MM/YYYY HH24:MI:SS');
  
    RETURN v_result;
  END actualizar_datos_tarea;

  -- mira si la simulación entrada por parámetro está en uso
  FUNCTION es_simulacion_en_uso(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2) RETURN NUMBER IS
    v_en_uso NUMBER := 0;
  BEGIN
    SELECT count(*)
      INTO v_en_uso
      FROM sch_grafico_recursos
     WHERE codigo_empresa = p_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_codigo_simulacion;
  
    RETURN v_en_uso;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN v_en_uso;
  END es_simulacion_en_uso;

  -- guarda los datos modificados del gráfico a la tabla sch_of_rutas
  PROCEDURE guardar_datos_grafico IS
  BEGIN
    UPDATE sch_of_rutas sor
       SET sor.fecha_ini_prevista =
           (SELECT gp.fecha_ini
              FROM sch_grafico_proyectos gp
             WHERE gp.codigo_empresa = sor.codigo_empresa
               AND gp.codigo_org_planta = sor.codigo_org_planta
               AND gp.numero_simulacion = sor.codigo_simulacion
               AND gp.orden_de_fabricacion = sor.orden_de_fabricacion
               AND gp.secuencia = sor.numero_secuencia_fabricacion),
           sor.fecha_fin_prevista =
           (SELECT gp.fecha_fin
              FROM sch_grafico_proyectos gp
             WHERE gp.codigo_empresa = sor.codigo_empresa
               AND gp.codigo_org_planta = sor.codigo_org_planta
               AND gp.numero_simulacion = sor.codigo_simulacion
               AND gp.orden_de_fabricacion = sor.orden_de_fabricacion
               AND gp.secuencia = sor.numero_secuencia_fabricacion);
  
    COMMIT;
  END guardar_datos_grafico;

  -- devuelve valores OF con id p_id_tarea
  FUNCTION get_task_details(p_id_tarea IN NUMBER) RETURN task_details_type IS
    -- Declare a variable of the custom type
    v_task_details   task_details_type;
    id_sesion_actual NUMBER;
  BEGIN
    SELECT MAX(id_sesion)
      INTO id_sesion_actual
      FROM sch_grafico_proyectos;
  
    SELECT orden_de_fabricacion, secuencia, codigo_org_planta, numero_simulacion, TO_CHAR(fecha_ini, 'DD/MM/YYYY'), TO_CHAR(fecha_ini, 'HH24:MI'), TO_CHAR(fecha_fin, 'DD/MM/YYYY'),
           TO_CHAR(fecha_fin, 'HH24:MI'), codigo_articulo, desc_articulo, desc_recurso, cant_aceptada, cant_a_fabricar, fase
      INTO v_task_details.orden_de_fabricacion, v_task_details.secuencia, v_task_details.codigo_org_planta, v_task_details.numero_simulacion, v_task_details.fecha_ini, v_task_details.hora_ini,
           v_task_details.fecha_fin, v_task_details.hora_fin, v_task_details.codigo_articulo, v_task_details.desc_articulo, v_task_details.desc_recurso, v_task_details.cant_aceptada,
           v_task_details.cant_a_fabricar, v_task_details.fase
      FROM sch_grafico_proyectos
     WHERE id_sesion = id_sesion_actual
       AND y = p_id_tarea;
  
    RETURN v_task_details;
  END get_task_details;

  -- Devuelve fecha ini y fin del turno
  FUNCTION get_hora_turno(p_codigo_org_planta VARCHAR2, p_empresa VARCHAR2) RETURN r_turnos IS
    v_turnos r_turnos;
  BEGIN
    SELECT MIN(hora_ini_turno), MAX(hora_fin_turno)
      INTO v_turnos.hora_ini_turno, v_turnos.hora_fin_turno
      FROM turnos_produccion
     WHERE codigo_org_planta = p_codigo_org_planta AND empresa = p_empresa;
  
    RETURN v_turnos;
  END get_hora_turno;

  -- Devuelve días de la semana si son o no laborables
  FUNCTION get_dias_semana_turno(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN r_dias_semana IS
    v_turnos r_dias_semana;
  BEGIN
    SELECT tipo_dia_lunes, tipo_dia_martes, tipo_dia_miercoles, tipo_dia_jueves, tipo_dia_viernes, tipo_dia_sabado, tipo_dia_domingo
      INTO v_turnos.lunes, v_turnos.martes, v_turnos.miercoles, v_turnos.jueves, v_turnos.viernes, v_turnos.sabado, v_turnos.domingo
      FROM calendario_planta_g
     WHERE codigo_org_planta = p_codigo_org_planta
       AND codigo_empresa = p_empresa;
  
    RETURN v_turnos;
  END get_dias_semana_turno;

  -- Determina si el dia es o no laboral. Devuelve 'LB' si es laborable y 'FO' si es festivo
  FUNCTION es_dia_laborable(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_date DATE) RETURN VARCHAR2 IS
    v_day_type VARCHAR2(2);
  BEGIN
    SELECT CASE MOD(TRUNC(p_date) - TRUNC(p_date, 'IW'), 7) + 1
             WHEN 1 THEN
              tipo_dia_lunes
             WHEN 2 THEN
              tipo_dia_martes
             WHEN 3 THEN
              tipo_dia_miercoles
             WHEN 4 THEN
              tipo_dia_jueves
             WHEN 5 THEN
              tipo_dia_viernes
             WHEN 6 THEN
              tipo_dia_sabado
             WHEN 7 THEN
              tipo_dia_domingo
           END
      INTO v_day_type
      FROM calendario_planta_g
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta;

    RETURN v_day_type;
  END es_dia_laborable;

  -- Devuelve el número de secuencias en la of pasada por parámetro. Mínimo 1.
  FUNCTION numero_secuencias_of(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER) RETURN NUMBER IS
    v_counter_ofs NUMBER := 0;
  BEGIN
    SELECT COUNT(*)
      INTO v_counter_ofs
      FROM sch_grafico_proyectos
     WHERE numero_simulacion = p_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND codigo_empresa = p_empresa
       AND codigo_org_planta = p_planta;
  
    RETURN v_counter_ofs;
  END numero_secuencias_of;

  -- cambia la fecha inicio y fin para que se adapte al calendario laboral de la planta
  PROCEDURE adaptar_tareas_a_calendario(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_ini DATE,
                                        p_fecha_fin DATE) IS
    hora_ini_turno DATE;
    hora_fin_turno DATE;
    hora_ini       VARCHAR2(20);
    hora_fin       VARCHAR2(20);
    v_turnos       r_turnos;
  
    ini_fecha_ini    DATE;
    v_fecha_ini      DATE;
    fecha_ini_string VARCHAR2(30);
    ini_fecha_fin    DATE;
    v_fecha_fin      DATE;
    fecha_fin_string VARCHAR2(30);
  
    v_next_date     DATE;
    v_previous_date DATE;
  
    v_ini_day_type      VARCHAR2(2);
    v_fin_day_type      VARCHAR2(2);
    v_fin_next_type     VARCHAR2(2);
    v_fin_previous_type VARCHAR2(2);
  
    v_difference NUMBER;
  
    v_difference_fecha_fin NUMBER;
    v_fecha_fin_turno      VARCHAR2(30);
    v_fecha_fin_turno_date DATE;
  
    v_difference_fecha_ini NUMBER;
    v_fecha_ini_turno      VARCHAR2(30);
    v_fecha_ini_turno_date DATE;
  
    v_counter_ofs                  NUMBER;
    v_fecha_fin_secuencia_anterior DATE;
    v_difference_inicial           NUMBER;
  
  BEGIN
    /*SELECT MIN(hora_ini_turno), MAX(hora_fin_turno)
      INTO hora_ini_turno, hora_fin_turno
      FROM turnos_produccion
     WHERE codigo_org_planta = p_codigo_org_planta;*/
     
    v_turnos := get_hora_turno(p_codigo_org_planta, p_codigo_empresa);
    
    hora_ini_turno := v_turnos.hora_ini_turno;
    hora_fin_turno := v_turnos.hora_fin_turno;
  
    hora_ini := TO_CHAR(hora_ini_turno, 'HH24:MI:SS');
    hora_fin := TO_CHAR(hora_fin_turno, 'HH24:MI:SS');
  
    v_fecha_ini := p_fecha_ini;
    v_fecha_fin := p_fecha_fin;
  
    ini_fecha_ini := v_fecha_ini;
    ini_fecha_fin := v_fecha_fin;
  
    -- Control de links entre tareas
    v_counter_ofs := numero_secuencias_of(p_codigo_empresa, p_codigo_org_planta, p_numero_simulacion, p_orden_de_fabricacion);
  
    IF v_counter_ofs > 1 AND p_secuencia > 1 THEN
      SELECT fecha_fin
        INTO v_fecha_fin_secuencia_anterior
        FROM sch_grafico_proyectos
       WHERE numero_simulacion = p_numero_simulacion
         AND orden_de_fabricacion = p_orden_de_fabricacion
         AND secuencia = p_secuencia - 1;
    
      IF v_fecha_fin_secuencia_anterior > v_fecha_ini THEN
        v_difference_inicial := v_fecha_fin - v_fecha_ini;
        v_fecha_ini := v_fecha_fin_secuencia_anterior;
        v_fecha_fin := v_fecha_ini + v_difference_inicial;
        ini_fecha_ini := v_fecha_ini;
        ini_fecha_fin := v_fecha_fin;
      END IF;
    
    END IF;
  
    -- Control fecha ini y fecha fin
    
    v_ini_day_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_fecha_ini);
    v_fin_day_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_fecha_fin);
  
    -- per a canviar v_fecha_ini
    IF v_ini_day_type = 'LB' THEN
    
      v_next_date := v_fecha_ini + 1;
      v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
    
      IF NOT (hora_ini <= TO_CHAR(v_fecha_fin, 'HH24:MI:SS') AND hora_fin >= TO_CHAR(v_fecha_fin, 'HH24:MI:SS')) THEN
        IF TO_CHAR(v_fecha_ini, 'HH24:MI:SS') BETWEEN '00:00:00' AND TO_CHAR(hora_ini_turno - 1 / 24 / 60 / 60, 'HH24:MI:SS') THEN
          -- 00:00:00 a 06:59:59
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini - 1, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
        
          v_difference_fecha_ini := v_fecha_ini - v_fecha_ini_turno_date;
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_ini := v_fecha_ini_turno_date + v_difference_fecha_ini;
        
        ELSIF v_fin_next_type = 'FO' AND TO_CHAR(v_fecha_ini, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- viernes de 23:00:00 a 23:59:59
          LOOP
            v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
          
            IF v_fin_next_type = 'LB' THEN
              EXIT;
            END IF;
          
            v_next_date := v_next_date + 1;
          END LOOP;
        
          fecha_ini_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00
          v_fecha_ini := TO_DATE(fecha_ini_string, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_ini := v_fecha_ini - ini_fecha_ini;
          fecha_ini_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00
          v_fecha_ini := TO_DATE(fecha_ini_string, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_ini := v_fecha_ini + v_difference_fecha_ini;
        
        ELSIF TO_CHAR(v_fecha_ini, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- lunes a jueves de 23:00:00 a 23:59:59
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_ini := v_fecha_ini - v_fecha_ini_turno_date;
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini + 1, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_ini := v_fecha_ini_turno_date + v_difference_fecha_ini; -- result
        
        END IF;
      
        v_difference := v_fecha_ini - ini_fecha_ini;
      
      END IF;
    ELSE
      v_next_date := v_fecha_ini + 1;
      -- dia y hora laboral siguiente
      LOOP
        v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
      
        IF v_fin_next_type = 'LB' THEN
          EXIT;
        END IF;
      
        v_next_date := v_next_date + 1;
      END LOOP;
    
      v_previous_date := v_fecha_ini - 1;
      -- dia y hora laboral anterior
      LOOP
        v_fin_previous_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_previous_date);
      
        IF v_fin_previous_type = 'LB' THEN
          EXIT;
        END IF;
      
        v_previous_date := v_previous_date - 1;
      END LOOP;
    
      fecha_ini_string := TO_CHAR(v_previous_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00
      v_fecha_ini := TO_DATE(fecha_ini_string, 'DD-MM-YYYY HH24:MI:SS');
      
      v_difference_fecha_ini := ini_fecha_ini - v_fecha_ini;
      fecha_ini_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00
      v_fecha_ini := TO_DATE(fecha_ini_string, 'DD-MM-YYYY HH24:MI:SS');
      
      v_fecha_ini := v_fecha_ini + v_difference_fecha_ini;
      
      -- si cae en horario no laboral
      IF NOT (hora_ini <= TO_CHAR(v_fecha_ini, 'HH24:MI:SS') AND hora_fin >= TO_CHAR(v_fecha_ini, 'HH24:MI:SS')) THEN
        --dbms_output.put_line(TO_DATE(v_fecha_ini, 'DD-MM-YYYY HH24:MI:SS'));
        --pkpantallas.log('Orensanz entra if ' || hora_ini || ' ' || TO_CHAR(v_fecha_ini, 'HH24:MI:SS') || ' ' || hora_fin);
      
        IF TO_CHAR(v_fecha_ini, 'HH24:MI:SS') BETWEEN '00:00:00' AND TO_CHAR(hora_ini_turno - 1 / 24 / 60 / 60, 'HH24:MI:SS') THEN
          -- 00:00:00 a 06:59:59
          --pkpantallas.log('Orensanz entra 00:00:00 a 06:59:59');
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini - 1, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
        
          v_difference_fecha_ini := v_fecha_ini - v_fecha_ini_turno_date;
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_ini := v_fecha_ini_turno_date + v_difference_fecha_ini;
        
        ELSIF v_fin_next_type = 'FO' AND TO_CHAR(v_fecha_ini, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- viernes de 23:00:00 a 23:59:59
          LOOP
            v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
          
            IF v_fin_next_type = 'LB' THEN
              EXIT;
            END IF;
          
            v_next_date := v_next_date + 1;
          END LOOP;
          
          fecha_ini_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00
          v_fecha_ini := TO_DATE(fecha_ini_string, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_ini := v_fecha_ini - ini_fecha_ini;
          fecha_ini_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00
          v_fecha_ini := TO_DATE(fecha_ini_string, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_ini := v_fecha_ini + v_difference_fecha_ini;
        
        ELSIF TO_CHAR(v_fecha_ini, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- lunes a jueves de 23:00:00 a 23:59:59
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_ini := v_fecha_ini - v_fecha_ini_turno_date;
          v_fecha_ini_turno := TO_CHAR(v_fecha_ini + 1, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_ini_turno_date := TO_DATE(v_fecha_ini_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_ini := v_fecha_ini_turno_date + v_difference_fecha_ini; -- result
        
        END IF;
      END IF;
    
      v_difference := v_fecha_ini - ini_fecha_ini;
      --dbms_output.put_line(v_difference);
    
    END IF;
  
    -- per a canviar v_fecha_fin
    IF ini_fecha_ini <> v_fecha_ini THEN
      v_fecha_fin := v_fecha_fin + v_difference;
    
      v_fin_day_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_fecha_fin);
    END IF;
  
    IF v_fin_day_type = 'LB' THEN
    
      v_next_date := v_fecha_fin + 1;
      v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
    
      IF NOT (hora_ini <= TO_CHAR(v_fecha_fin, 'HH24:MI:SS') AND hora_fin >= TO_CHAR(v_fecha_fin, 'HH24:MI:SS')) THEN
        IF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN '00:00:00' AND TO_CHAR(hora_ini_turno - 1 / 24 / 60 / 60, 'HH24:MI:SS') THEN
          -- 00:00:00 a 06:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin - 1, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
        
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin;
        
        ELSIF v_fin_next_type = 'FO' AND TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- viernes de 23:00:00 a 23:59:59
          LOOP
            v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
          
            IF v_fin_next_type = 'LB' THEN
              EXIT;
            END IF;
          
            v_next_date := v_next_date + 1;
          END LOOP;
        
          fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_fin := v_fecha_fin - ini_fecha_fin;
          fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin + v_difference_fecha_fin;
        
        ELSIF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- lunes a jueves de 23:00:00 a 23:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin + 1, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin; -- result
        END IF;
      END IF;
    ELSE
    
      v_next_date := v_fecha_fin + 1;
    
      -- dia y hora laboral siguiente
      LOOP
        v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
      
        IF v_fin_next_type = 'LB' THEN
          EXIT;
        END IF;
      
        v_next_date := v_next_date + 1;
      END LOOP;
    
      v_previous_date := v_fecha_fin - 1;
      -- dia y hora laboral anterior
      LOOP
        v_fin_previous_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_previous_date);
      
        IF v_fin_previous_type = 'LB' THEN
          EXIT;
        END IF;
        --dbms_output.put_line(TO_CHAR(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS'));
        v_previous_date := v_previous_date - 1;
      END LOOP;
      --pkpantallas.log('Orensanz ini -> ' || TO_CHAR(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS') || ' of: ' || p_orden_de_fabricacion);
    
      fecha_fin_string := TO_CHAR(v_previous_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- viernes con 23:00
      v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
      v_difference_fecha_fin := ini_fecha_fin - v_fecha_fin;
      fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- lunes con 07:00
      v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
      v_fecha_fin := v_fecha_fin + v_difference_fecha_fin;
    
      --pkpantallas.log('Orensanz fin -> ' || TO_CHAR(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS') || ' of: ' || p_orden_de_fabricacion);
    
      -- si la fecha llamada cae fuera de hora laboral
      IF NOT (hora_ini <= TO_CHAR(v_fecha_fin, 'HH24:MI:SS') AND hora_fin >= TO_CHAR(v_fecha_fin, 'HH24:MI:SS')) THEN
        --pkpantallas.log('Orensanz entra if ' || hora_ini || ' ' || TO_CHAR(v_fecha_fin, 'HH24:MI:SS') || ' ' || hora_fin);
      
        v_next_date := v_fecha_fin + 1;
        v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
      
        IF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN '00:00:00' AND TO_CHAR(hora_ini_turno - 1 / 24 / 60 / 60, 'HH24:MI:SS') THEN
          -- 00:00:00 a 06:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin - 1, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
        
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin;
        
        ELSIF v_fin_next_type = 'FO' AND TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- viernes de 23:00:00 a 23:59:59
          LOOP
            v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
          
            IF v_fin_next_type = 'LB' THEN
              EXIT;
            END IF;
          
            v_next_date := v_next_date + 1;
          END LOOP;
        
          fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_fin := v_fecha_fin - ini_fecha_fin;
          fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin + v_difference_fecha_fin;
        
        ELSIF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- lunes a jueves de 23:00:00 a 23:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 23:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin + 1, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin; -- result
        END IF;
      END IF;
    
    END IF;
  
  
    dbms_output.put_line(TO_CHAR(v_fecha_ini, 'DD-MM-YYYY HH24:MI:SS') || ' - ' || TO_CHAR(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS'));
    -- se actualiza la tabla para ver
    UPDATE sch_grafico_proyectos sgp
       SET sgp.fecha_ini = v_fecha_ini,
           sgp.fecha_fin = v_fecha_fin
     WHERE sgp.orden_de_fabricacion = p_orden_de_fabricacion
       AND sgp.secuencia = p_secuencia
       AND sgp.codigo_empresa = p_codigo_empresa
       AND sgp.numero_simulacion = p_numero_simulacion
       AND sgp.codigo_org_planta = p_codigo_org_planta;
  
    COMMIT;
  
  END adaptar_tareas_a_calendario;

  -- comprueba que está dentro de calendario laboral
  FUNCTION es_fecha_laborable(p_fecha DATE, p_ini_turno VARCHAR2, p_fin_turno VARCHAR2, p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN BOOLEAN IS
    v_dia_semana VARCHAR2(2);
    v_ini_turno  DATE;
    v_fin_turno  DATE;
  BEGIN
    v_dia_semana := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, p_fecha);
    IF v_dia_semana = 'FO' THEN
      RETURN FALSE;
    ELSE
      v_ini_turno := TO_DATE(TO_CHAR(p_fecha, 'DD-MM-YYYY') || ' ' || p_ini_turno || ':00', 'DD-MM-YYYY HH24:MI:SS');
      v_fin_turno := TO_DATE(TO_CHAR(p_fecha, 'DD-MM-YYYY') || ' ' || p_fin_turno || ':00', 'DD-MM-YYYY HH24:MI:SS');
      RETURN(p_fecha >= v_ini_turno AND p_fecha <= v_fin_turno);
    END IF;
  END es_fecha_laborable;

  FUNCTION devuelve_fechas_iniciales(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN r_fecha_record_type IS
    v_fechas r_fecha_record_type;
  BEGIN
    SELECT fecha_ini, fecha_fin
      INTO v_fechas.fecha_ini, v_fechas.fecha_fin
      FROM sch_grafico_proyectos
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_numero_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND secuencia = p_secuencia;
  
    RETURN v_fechas;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN NULL;
  END devuelve_fechas_iniciales;

  -- devuelve la fecha_fin calculada con el calendario de la planta
  FUNCTION devuelve_fecha_fin_calendario(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fin DATE) RETURN VARCHAR2 IS
    hora_ini_turno DATE;
    hora_fin_turno DATE;
    hora_ini       VARCHAR2(20);
    hora_fin       VARCHAR2(20);
  
    --v_fecha_ini      DATE;
    ini_fecha_fin    DATE;
    v_fecha_fin      DATE;
    fecha_fin_string VARCHAR2(30);
  
    v_next_date     DATE;
    v_previous_date DATE;
  
    v_fin_day_type      VARCHAR2(2);
    v_fin_next_type     VARCHAR2(2);
    v_fin_previous_type VARCHAR2(2);
  
    v_difference_fecha_fin NUMBER;
    v_fecha_fin_turno      VARCHAR2(30);
    v_fecha_fin_turno_date DATE;
  
    v_result VARCHAR2(30);
  
  BEGIN
    SELECT MIN(hora_ini_turno), MAX(hora_fin_turno)
      INTO hora_ini_turno, hora_fin_turno
      FROM turnos_produccion
     WHERE codigo_org_planta = p_codigo_org_planta;
  
    hora_ini := TO_CHAR(hora_ini_turno, 'HH24:MI:SS');
    hora_fin := TO_CHAR(hora_fin_turno, 'HH24:MI:SS');
  
    --v_fecha_ini := p_fecha_ini;
    v_fecha_fin := p_fecha_fin;
  
    --ini_fecha_ini := v_fecha_ini;
    ini_fecha_fin := v_fecha_fin;
  
    -- Control fecha ini y fecha fin
    --v_ini_day_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_fecha_ini);
    v_fin_day_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_fecha_fin);
  
    -- per a canviar v_fecha_ini
  
    IF v_fin_day_type = 'LB' THEN
      --dbms_output.put_line('fin Working day');
    
      v_next_date := v_fecha_fin + 1;
      v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
    
      IF NOT (hora_ini <= TO_CHAR(v_fecha_fin, 'HH24:MI:SS') AND hora_fin >= TO_CHAR(v_fecha_fin, 'HH24:MI:SS')) THEN
        IF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN '00:00:00' AND TO_CHAR(hora_ini_turno - 1 / 24 / 60 / 60, 'HH24:MI:SS') THEN
          -- 00:00:00 a 06:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin - 1, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 22:59:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
        
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 7:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin;
        
        ELSIF v_fin_next_type = 'FO' AND TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- viernes de 23:00:00 a 23:59:59
          LOOP
            v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
          
            IF v_fin_next_type = 'LB' THEN
              EXIT;
            END IF;
          
            v_next_date := v_next_date + 1;
          END LOOP;
        
          fecha_fin_string := TO_CHAR(ini_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 22:59
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
        
          v_difference_fecha_fin := ini_fecha_fin - v_fecha_fin;
        
          fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin + v_difference_fecha_fin;
        
        ELSIF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- lunes a jueves de 23:00:00 a 23:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 22:59:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin + 1, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 7:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin; -- result
        END IF;
      END IF;
    ELSE
    
      v_next_date := v_fecha_fin + 1;
    
      -- dia y hora laboral siguiente
      LOOP
        v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
      
        IF v_fin_next_type = 'LB' THEN
          EXIT;
        END IF;
      
        v_next_date := v_next_date + 1;
      END LOOP;
    
      v_previous_date := v_fecha_fin - 1;
      -- dia y hora laboral anterior
      LOOP
        v_fin_previous_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_previous_date);
      
        IF v_fin_previous_type = 'LB' THEN
          EXIT;
        END IF;
        v_previous_date := v_previous_date - 1;
      END LOOP;
    
      fecha_fin_string := TO_CHAR(v_previous_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- viernes con 22:59
      v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
      v_difference_fecha_fin := ini_fecha_fin - v_fecha_fin;
      fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- lunes con 07:00
      v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
      v_fecha_fin := v_fecha_fin + v_difference_fecha_fin;
    
    
      -- si la fecha llamada cae fuera de hora laboral
      IF NOT (hora_ini <= TO_CHAR(v_fecha_fin, 'HH24:MI:SS') AND hora_fin >= TO_CHAR(v_fecha_fin, 'HH24:MI:SS')) THEN
      
        v_next_date := v_fecha_fin + 1;
        v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
      
        IF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN '00:00:00' AND TO_CHAR(hora_ini_turno - 1 / 24 / 60 / 60, 'HH24:MI:SS') THEN
          -- 00:00:00 a 06:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin - 1, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 22:59:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
        
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 7:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin;
        
        ELSIF v_fin_next_type = 'FO' AND TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- viernes de 23:00:00 a 23:59:59
          LOOP
            v_fin_next_type := es_dia_laborable(p_codigo_empresa, p_codigo_org_planta, v_next_date);
          
            IF v_fin_next_type = 'LB' THEN
              EXIT;
            END IF;
          
            v_next_date := v_next_date + 1;
          END LOOP;
        
          fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 22:59
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_fin := v_fecha_fin - ini_fecha_fin;
          fecha_fin_string := TO_CHAR(v_next_date, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 07:00
          v_fecha_fin := TO_DATE(fecha_fin_string, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin + v_difference_fecha_fin;
        
        ELSIF TO_CHAR(v_fecha_fin, 'HH24:MI:SS') BETWEEN TO_CHAR(hora_fin_turno + 1 / 24 / 60 / 60, 'HH24:MI:SS') AND '23:59:59' THEN
          -- lunes a jueves de 23:00:00 a 23:59:59
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY') || ' ' || hora_fin; -- fecha con 22:59:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_difference_fecha_fin := v_fecha_fin - v_fecha_fin_turno_date;
          v_fecha_fin_turno := TO_CHAR(v_fecha_fin + 1, 'DD-MM-YYYY') || ' ' || hora_ini; -- fecha con 7:00:00
          v_fecha_fin_turno_date := TO_DATE(v_fecha_fin_turno, 'DD-MM-YYYY HH24:MI:SS');
          v_fecha_fin := v_fecha_fin_turno_date + v_difference_fecha_fin; -- result
        END IF;
      END IF;
    
    END IF;
  
    v_result := TO_CHAR(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS');
  
    RETURN v_result;
  END devuelve_fecha_fin_calendario;

  -- Actualiza las fechas de las fechas enlazadas a la OF pasada por parámetro
  FUNCTION actualizar_ofs_enlazadas(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, v_counter_ofs NUMBER, p_duracion NUMBER) RETURN VARCHAR2 IS
    v_i                             NUMBER := p_secuencia + 1;
    v_index                         NUMBER := 0; -- Contador para el índice de v_result
    v_fecha_fin_secuencia_anterior  DATE;
    v_fecha_ini_secuencia_siguiente DATE;
    v_fecha_fin_secuencia_siguiente DATE;
    v_duracion                      NUMBER := p_duracion;
  
    v_nueva_fecha_ini             DATE;
    v_nueva_fecha_ini_varchar     VARCHAR2(40);
    v_nueva_fecha_fin             VARCHAR2(30);
    
    v_result t_array_fecha;
    v_temp_registro t_registro_fecha;
    
    v_result_json CLOB;
    v_coma        VARCHAR2(2) := '';
    
    v_turnos r_turnos;
    v_turno_ini DATE;
    v_turno_fin DATE;
    v_duracion_no_laboral NUMBER;
    
  BEGIN
    --pkpantallas.log('ARREGLA ENLAZADAS: of -> ' || p_orden_de_fabricacion || ', sec -> ' || p_secuencia || ', counter_of -> ' || v_counter_ofs);
    WHILE v_i <= v_counter_ofs LOOP
      --pkpantallas.log(v_i);
    
      SELECT fecha_fin
        INTO v_fecha_fin_secuencia_anterior
        FROM sch_grafico_proyectos
       WHERE numero_simulacion = p_simulacion
         AND orden_de_fabricacion = p_orden_de_fabricacion
         AND codigo_empresa = p_empresa
         AND codigo_org_planta = p_planta
         AND secuencia = v_i - 1;
    
      SELECT fecha_ini, fecha_fin, y
        INTO v_fecha_ini_secuencia_siguiente, v_fecha_fin_secuencia_siguiente, v_temp_registro.y
        FROM sch_grafico_proyectos
       WHERE numero_simulacion = p_simulacion
         AND orden_de_fabricacion = p_orden_de_fabricacion
         AND codigo_empresa = p_empresa
         AND codigo_org_planta = p_planta
         AND secuencia = v_i;
          
      IF v_fecha_fin_secuencia_anterior > v_fecha_ini_secuencia_siguiente THEN
        --pkpantallas.log('COLISIONA');
        
        v_turnos := get_hora_turno(p_planta, p_empresa);
        v_turno_ini := TRUNC(v_fecha_fin_secuencia_siguiente) + (v_turnos.hora_ini_turno - TRUNC(v_turnos.hora_ini_turno));
        v_turno_fin := TRUNC(v_fecha_ini_secuencia_siguiente) + (v_turnos.hora_fin_turno - TRUNC(v_turnos.hora_fin_turno));
        v_duracion_no_laboral := obtiene_tiempo_no_laboral(p_empresa, p_planta, v_fecha_ini_secuencia_siguiente, v_turno_ini, v_turno_fin);
        --pkpantallas.log(v_duracion_no_laboral);
        v_duracion := (v_fecha_fin_secuencia_siguiente - v_fecha_ini_secuencia_siguiente)*24*60;
        v_duracion := v_duracion - v_duracion_no_laboral*24*60;
        --pkpantallas.log(v_duracion/60);
        --pkpantallas.log(p_duracion);
      
        v_nueva_fecha_ini := v_fecha_fin_secuencia_anterior;

        --        
        v_nueva_fecha_fin := calcula_fecha_fin(p_empresa, p_planta, v_nueva_fecha_ini, v_duracion);
    
        v_nueva_fecha_ini_varchar := TO_CHAR(v_nueva_fecha_ini, 'DD-MM-YYYY HH24:MI:SS');
        
        -- actualiza a base de datos
        v_nueva_fecha_fin := actualizar_datos_tarea_con_fecha_fin(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, v_i, v_nueva_fecha_ini_varchar, v_nueva_fecha_fin);
        --
        
        v_temp_registro.secuencia := v_i;
        v_temp_registro.fecha_ini := TO_CHAR(v_nueva_fecha_ini, 'DD-MM-YYYY HH24:MI:SS');
        v_temp_registro.fecha_fin := v_nueva_fecha_fin;
                
        v_result(v_index) := v_temp_registro; -- Usa v_index como índice
        
        v_index := v_index + 1;
      END IF;
      
      v_i := v_i + 1;
    END LOOP;
    
    -- devuelve un VARCHAR2 que contenga una representación JSON de los datos de las secuencias cambiadas
    v_result_json := '[';

    FOR i IN v_result.FIRST..v_result.LAST LOOP
      IF NOT v_result.EXISTS(i) THEN
        CONTINUE;
      END IF;

      v_result_json := v_result_json || v_coma || 
                       '{"secuencia": ' || v_result(i).secuencia || 
                       ', "fecha_ini": "' || v_result(i).fecha_ini || 
                       '", "fecha_fin": "' || v_result(i).fecha_fin || 
                       '", "id": ' || v_result(i).y || '}';

      v_coma := ', ';
    END LOOP;

    v_result_json := v_result_json || ']';
    pkpantallas.log(v_result_json);
    RETURN v_result_json;
  END actualizar_ofs_enlazadas;

  -- entre dos fechas devuelve el tiempo no laboral
  FUNCTION obtiene_tiempo_no_laboral(p_empresa VARCHAR2, p_planta VARCHAR2, p_f_ini DATE, p_turno_ini DATE, p_turno_fin DATE) RETURN NUMBER IS
    v_duracion_no_laboral NUMBER := 0;
    v_day_of_week         NUMBER;
    v_current_date        DATE := p_f_ini;
    v_beginning_of_day    DATE;
    v_end_of_day          DATE;
    v_day_type            VARCHAR2(2);
    
  BEGIN
    WHILE v_current_date <= TRUNC(p_turno_ini) LOOP
      v_day_of_week := TO_CHAR(v_current_date, 'D');
      SELECT DECODE(v_day_of_week, 1, tipo_dia_lunes, 2, tipo_dia_martes, 3, tipo_dia_miercoles, 4, tipo_dia_jueves, 5, tipo_dia_viernes, 6, tipo_dia_sabado, 7, tipo_dia_domingo)
        INTO v_day_type
        FROM calendario_planta_g
       WHERE codigo_org_planta = p_planta
         AND codigo_empresa = p_empresa;
      
      IF v_day_type = 'FO' THEN
        dbms_output.put_line('No LABORAL');
        -- No laboral, suma 24 horas
        v_duracion_no_laboral := v_duracion_no_laboral + 1; -- suma por días
        --pkpantallas.log('+24 ' || v_duracion_no_laboral);
          
      ELSE
        dbms_output.put_line('LABORAL');
        -- Laboral, calcula las horas no laborales
        IF v_current_date = TRUNC(p_turno_fin) THEN
          -- 23:59:59 - v_turnos.hora_fin_turno
          v_end_of_day := TRUNC(p_turno_fin) + (23 / 24) + (59 / (24 * 60)) + (59 / (24 * 60 * 60)); -- 23:59:59
          v_duracion_no_laboral := v_duracion_no_laboral + (v_end_of_day - p_turno_fin);
          --pkpantallas.log('de 23:59 a fin ' || v_duracion_no_laboral);

        ELSIF v_current_date = TRUNC(p_turno_ini) THEN
          -- v_turnos.hora_ini_turno - 00:00:00
          v_beginning_of_day := TRUNC(p_turno_ini); -- 00:00:00
          v_duracion_no_laboral := v_duracion_no_laboral + (p_turno_ini - v_beginning_of_day);
          --pkpantallas.log('de ini a 00:00 ' || v_duracion_no_laboral);
            
        ELSE
          --dbms_output.put_line('hey3');
          v_beginning_of_day := TRUNC(p_turno_ini); -- 00:00:00
          v_duracion_no_laboral := v_duracion_no_laboral + (p_turno_ini - v_beginning_of_day);
          v_end_of_day := TRUNC(p_turno_fin) + (23 / 24) + (59 / (24 * 60)) + (59 / (24 * 60 * 60)); -- 23:59:59
          v_duracion_no_laboral := v_duracion_no_laboral + (v_end_of_day - p_turno_fin);
          --pkpantallas.log('hey ' || v_duracion_no_laboral);
        END IF;
        
      END IF;
      --pkpantallas.log('');
      v_current_date := v_current_date + 1;
    END LOOP;
    
    RETURN v_duracion_no_laboral;
  END obtiene_tiempo_no_laboral;

  -- @DEPRECATED
  -- Calcula la fecha fin a partir de la posición de fecha_ini
  FUNCTION calcula_nueva_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio DATE, p_duracion NUMBER) RETURN VARCHAR2 IS
    v_fechas_iniciales    r_fecha_record_type;
    
    v_turnos              r_turnos;
    v_turno_ini           DATE;
    v_turno_fin           DATE;
    v_duracion_total      NUMBER;
    v_duracion_no_laboral NUMBER := 0;

    v_task_start_time     VARCHAR2(5);
    v_task_end_time       VARCHAR2(5);
    v_turno_ini_hora      VARCHAR2(5);
    v_turno_fin_hora      VARCHAR2(5);
    v_current_date        DATE;

    v_fecha_fin           DATE;
    v_result              VARCHAR2(30);
    v_result_update       VARCHAR2(30);
    v_dummy_ff            DATE;
    v_duracion_en_horas   NUMBER := p_duracion / 60;
    
    /*v_dummy_number        NUMBER;
    v_dummy_diff          NUMBER;
    v_dummy_date          DATE;
    v_dummy_varchar       VARCHAR2(50);*/

  BEGIN
    v_fechas_iniciales := devuelve_fechas_iniciales(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia);
    v_dummy_ff := v_fechas_iniciales.fecha_ini + (v_duracion_en_horas / 24);
  
    v_turnos := get_hora_turno(p_planta, p_empresa);
  
    --mirar las horas laborables reales (sin contar fin de semana o horario no laboral)
    v_duracion_total := v_fechas_iniciales.fecha_fin - v_fechas_iniciales.fecha_ini;
  
    v_turno_ini := TRUNC(v_fechas_iniciales.fecha_fin) + (v_turnos.hora_ini_turno - TRUNC(v_turnos.hora_ini_turno));
    v_turno_fin := TRUNC(v_fechas_iniciales.fecha_ini) + (v_turnos.hora_fin_turno - TRUNC(v_turnos.hora_fin_turno));
  
    -- Suma las horas no laborables entre la fecha ini y fin iniciales, si la tarea pasa por horas no laborables
    v_current_date := TRUNC(v_fechas_iniciales.fecha_ini);
  
    IF TRUNC(v_fechas_iniciales.fecha_ini) <> TRUNC(v_fechas_iniciales.fecha_fin) THEN
      v_duracion_no_laboral := obtiene_tiempo_no_laboral(p_empresa, p_planta, v_current_date, v_turno_ini, v_turno_fin);
      
      v_fecha_fin := p_fecha_inicio + (v_duracion_total - v_duracion_no_laboral);
      -- sumar la nueva fecha_ini con la duracion
      v_task_start_time := TO_CHAR(p_fecha_inicio, 'HH24:MI');
      v_task_end_time := TO_CHAR(v_fecha_fin, 'HH24:MI');
      v_turno_ini_hora := TO_CHAR(v_turno_ini, 'HH24:MI');
      v_turno_fin_hora := TO_CHAR(v_turno_fin, 'HH24:MI');
      
      -- cuando la tarea se mueva a fecha inicio y fin laborables pero hay un periodo no laborable entre estas
      IF es_fecha_laborable(p_fecha_inicio, v_turno_ini_hora, v_turno_fin_hora, p_empresa, p_planta) = TRUE AND es_fecha_laborable(v_fecha_fin, v_turno_ini_hora, v_turno_fin_hora, p_empresa, p_planta) = TRUE AND (v_turno_fin_hora >= v_task_start_time  AND v_turno_ini_hora <= v_task_end_time) AND TRUNC(p_fecha_inicio) <> TRUNC(v_fecha_fin) THEN
        v_turno_ini := TRUNC(v_fecha_fin) + (v_turnos.hora_ini_turno - TRUNC(v_turnos.hora_ini_turno));
        v_turno_fin := TRUNC(p_fecha_inicio) + (v_turnos.hora_fin_turno - TRUNC(v_turnos.hora_fin_turno));
        v_duracion_no_laboral := obtiene_tiempo_no_laboral(p_empresa, p_planta, p_fecha_inicio, v_turno_ini, v_turno_fin);
        v_fecha_fin := v_fecha_fin + v_duracion_no_laboral;
        --v_fecha_fin := v_fecha_fin + v_duracion_no_laboral;
      END IF;
      
      --v_dummy_number := ((TO_DATE(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS') - p_fecha_inicio) - v_duracion_no_laboral)*24;
      
    ELSE
      v_fecha_fin := p_fecha_inicio + v_duracion_total;
      
      -- cuando la tarea se mueva a fecha inicio y fin laborables pero hay un periodo no laborable entre estas
      v_task_start_time := TO_CHAR(p_fecha_inicio, 'HH24:MI');
      v_task_end_time := TO_CHAR(v_fecha_fin, 'HH24:MI');
      v_turno_ini_hora := TO_CHAR(v_turno_ini, 'HH24:MI');
      v_turno_fin_hora := TO_CHAR(v_turno_fin, 'HH24:MI');
      
      IF es_fecha_laborable(p_fecha_inicio, v_turno_ini_hora, v_turno_fin_hora, p_empresa, p_planta) = TRUE AND es_fecha_laborable(v_fecha_fin, v_turno_ini_hora, v_turno_fin_hora, p_empresa, p_planta) = true AND (v_turno_fin_hora >= v_task_start_time  AND v_turno_ini_hora <= v_task_end_time) AND TRUNC(p_fecha_inicio) <> TRUNC(v_fecha_fin) THEN
        v_turno_ini := TRUNC(v_fecha_fin) + (v_turnos.hora_ini_turno - TRUNC(v_turnos.hora_ini_turno));
        v_turno_fin := TRUNC(p_fecha_inicio) + (v_turnos.hora_fin_turno - TRUNC(v_turnos.hora_fin_turno));
        v_duracion_no_laboral := obtiene_tiempo_no_laboral(p_empresa, p_planta, p_fecha_inicio, v_turno_ini, v_turno_fin);
        v_fecha_fin := v_fecha_fin + v_duracion_no_laboral;
        --v_fecha_fin := v_fecha_fin + ((v_turno_ini + 1) - v_turno_fin);
      END IF;
      
      --v_dummy_number := ((TO_DATE(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS') - p_fecha_inicio) - v_duracion_no_laboral)*24;
    END IF;
    
    -- llamar a adaptar la fecha fin a calendario
    v_result := devuelve_fecha_fin_calendario(p_empresa, p_planta, v_fecha_fin);
    
    -- update en la tabla
    v_result_update := actualizar_datos_tarea_con_fecha_fin(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, TO_CHAR(p_fecha_inicio, 'DD-MM-YYYY HH24:MI:SS'), v_result);
    dbms_output.put_line(v_result_update);
    
    RETURN v_result;
  END calcula_nueva_fecha_fin;

  -- Mira si la tarea movida con enlace tiene una fecha fin mayor a la inicio de la siguiente secuencia (colisionan)
  FUNCTION hay_colisiones(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_fin VARCHAR2) RETURN BOOLEAN IS
    p_fecha_fin_anterior  DATE := TO_DATE(p_fecha_fin, 'DD-MM-YYYY HH24:MI:SS');
    p_fecha_ini_siguiente DATE;
  BEGIN
  
    SELECT fecha_ini
      INTO p_fecha_ini_siguiente
      FROM sch_grafico_proyectos
     WHERE numero_simulacion = p_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND codigo_empresa = p_empresa
       AND codigo_org_planta = p_planta
       AND secuencia = p_secuencia + 1;
  
    RETURN(p_fecha_fin_anterior > p_fecha_ini_siguiente);
  
  END hay_colisiones;
  
  -- suma a la fecha pasada por parámetro la duración en horas pero solo suma las horas laborables teniendo en cuenta el horario de la planta
  FUNCTION suma_duracion_laborable(p_fecha_inicio DATE, p_turno_ini NUMBER, p_turno_fin NUMBER, duration_hours NUMBER, p_empresa VARCHAR2, p_planta VARCHAR2) RETURN DATE IS
    v_nueva_fecha DATE;
    v_date DATE := p_fecha_inicio;
    v_horas_restantes NUMBER;
  BEGIN
    v_horas_restantes := duration_hours/60;  -- Inicializa con el valor de duration_hours pasado a horas
    WHILE v_horas_restantes > 0 LOOP
      IF TO_NUMBER(TO_CHAR(v_date, 'HH24')) + v_horas_restantes > p_turno_fin THEN
          -- Subtract the remaining hours of the current day
          v_horas_restantes := v_horas_restantes - (p_turno_fin - TO_NUMBER(TO_CHAR(v_date, 'HH24')));

          -- Bucle hasta encontrar el día laboral siguiente
          LOOP
              v_date := TRUNC(v_date) + 1;
              EXIT WHEN es_dia_laborable(p_empresa, p_planta, v_date) = 'LB';
          END LOOP;
          -- Ajusta la fecha a la fecha inicio del día laboral siguiente
          v_date := TRUNC(v_date) + p_turno_ini/24; -- para sumar tiempos a una fecha hay que pasar la duración a días
          pkpantallas.log(TO_CHAR(v_date, 'DD-MM-YYYY HH24:MI:SS'));
      ELSE
          v_date := v_date + v_horas_restantes/24; -- para sumar tiempos a una fecha hay que pasar la duración a días
          v_horas_restantes := 0;
      END IF;
    END LOOP;
    
    v_nueva_fecha := v_date;
    RETURN v_nueva_fecha;
  END suma_duracion_laborable;

  -- convierte hora en formato "HH24:MI" a decimal. p. ej. "08:00" -> 8
  FUNCTION convierte_hora_a_decimal(p_hora VARCHAR2) RETURN NUMBER IS
    v_horas NUMBER;
    v_minutos NUMBER;
    v_tiempo_decimal NUMBER;
  BEGIN
      SELECT TO_NUMBER(SUBSTR(p_hora, 1, INSTR(p_hora, ':') - 1)), 
             TO_NUMBER(SUBSTR(p_hora, INSTR(p_hora, ':') + 1))
      INTO v_horas, v_minutos
      FROM dual;

      v_tiempo_decimal := v_horas + v_minutos / 60;

      RETURN v_tiempo_decimal;
  END convierte_hora_a_decimal;
  
  -- convierte decimal a hora en formato "HH24:MI" en varchar2. p. ej. 22.9833 -> "22:59"
  FUNCTION convierte_decimal_a_hora(p_hora_decimal NUMBER) RETURN VARCHAR2 IS
    v_horas NUMBER;
    v_minutos NUMBER;
    v_tiempo_formateado VARCHAR2(5);
  BEGIN
      v_horas := TRUNC(p_hora_decimal);
      v_minutos := ROUND((p_hora_decimal - v_horas) * 60);

      IF v_minutos = 60 THEN
          v_horas := v_horas + 1;
          v_minutos := 0;
      END IF;

      v_tiempo_formateado := LPAD(TO_CHAR(v_horas), 2, '0') || ':' || LPAD(TO_CHAR(v_minutos), 2, '0');

      RETURN v_tiempo_formateado;
  END convierte_decimal_a_hora;
  
  -- dada una fecha inicio y una duración calcula la fecha fin de la tarea teniendo en cuenta el calendario de la planta
  FUNCTION calcula_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_fecha_inicio DATE, p_duracion NUMBER) RETURN VARCHAR2 IS
    v_turnos r_turnos;
    v_ini_turno NUMBER;
    v_fin_turno NUMBER;
    v_result        VARCHAR2(4000);
    v_result_date   DATE;
    
  BEGIN
    v_turnos := get_hora_turno(p_planta, p_empresa);
    v_ini_turno := convierte_hora_a_decimal(TO_CHAR(v_turnos.hora_ini_turno, 'HH24:MI'));
    v_fin_turno := convierte_hora_a_decimal(TO_CHAR(v_turnos.hora_fin_turno, 'HH24:MI'));
    v_result_date := suma_duracion_laborable(p_fecha_inicio, v_ini_turno, v_fin_turno, p_duracion, p_empresa, p_planta);
    v_result := TO_CHAR(v_result_date, 'DD-MM-YYYY HH24:MI:SS');
    
    RETURN v_result;
  END calcula_fecha_fin;

  -- Calcula la fecha fin a partir de la posición de fecha_ini y controla las enlazadas
  FUNCTION actualizar_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio DATE, p_duracion NUMBER) RETURN VARCHAR2 IS    
    v_result        VARCHAR2(4000);
    v_fecha_ini     VARCHAR2(40) := TO_CHAR(p_fecha_inicio, 'DD-MM-YYYY HH24:MI:SS');
    v_counter_ofs   NUMBER;
    v_enlazadas_actualizadas VARCHAR2(4000);
  
  BEGIN
    v_result := calcula_fecha_fin(p_empresa, p_planta, p_fecha_inicio, p_duracion);
    
    -- actualiza a base de datos
    v_result := actualizar_datos_tarea_con_fecha_fin(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, v_fecha_ini, v_result);
    
    -- arreglar enlaces de diferentes secuencias (si hay)     
    v_counter_ofs := numero_secuencias_of(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion);
        
    IF v_counter_ofs > 1 AND v_counter_ofs > p_secuencia AND hay_colisiones(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, v_result) THEN
      v_enlazadas_actualizadas := actualizar_ofs_enlazadas(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, v_counter_ofs, p_duracion);
      v_result := '"fecha_fin":"' || v_result || '", "secuencias":' || v_enlazadas_actualizadas;
    ELSE 
      v_result := '"fecha_fin":"' || v_result || '", "secuencias":[]';
    END IF;
    
    RETURN v_result;
  END actualizar_fecha_fin;

  -- Devuelve las fechas de la secuencia de la OF
  FUNCTION get_fechas_secuencia(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN VARCHAR2 IS
    v_result    VARCHAR2(80);
    v_fecha_ini DATE;
    v_fecha_fin DATE;
  BEGIN
    SELECT fecha_ini, fecha_fin
      INTO v_fecha_ini, v_fecha_fin
      FROM sch_grafico_proyectos
     WHERE numero_simulacion = p_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND secuencia = p_secuencia
       AND codigo_empresa = p_empresa
       AND codigo_org_planta = p_planta;
  
    v_result := TO_CHAR(v_fecha_ini, 'DD-MM-YYYY HH24:MI:SS') || ',' || TO_CHAR(v_fecha_fin, 'DD-MM-YYYY HH24:MI:SS');
  
    RETURN v_result;
  END get_fechas_secuencia;

END pk_web_p_ccmaqs;
/
