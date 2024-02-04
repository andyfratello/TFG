CREATE OR REPLACE PACKAGE pk_web_p_ccmaqs_xe AS
  /* pk_web_p_ccmaqs_xe
  * --------------------------------------------------------------------------------------------------
  * Descripción:
  *  Gantt de la Carga de Máquinas
  * --------------------------------------------------------------------------------------------------
  * Version:    2023.10.18
  * --------------------------------------------------------------------------------------------------
  */

  TYPE tp_of IS TABLE OF pk_web_p_ccmaqs.r_of;

  TYPE tp_recurso IS TABLE OF pk_web_p_ccmaqs.r_recurso;
  
  TYPE r_turnos IS TABLE OF pk_web_p_ccmaqs.r_turnos;
  
  TYPE r_dias_semana IS TABLE OF pk_web_p_ccmaqs.r_dias_semana;

  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2) RETURN tp_of
    PIPELINED;
    
  PROCEDURE rehacer_tablas(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                        p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2,/* p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2, */p_desde_seccion VARCHAR2,
                        p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2);

  FUNCTION get_recursos_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN tp_recurso
    PIPELINED;
    
  FUNCTION actualizar_datos_tarea_con_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2, p_fecha_fin VARCHAR2) RETURN VARCHAR2;
    
  FUNCTION actualizar_datos_tarea(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2/*, p_cambio_recurso BOOLEAN,
                                  p_desde_proyecto VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_maquina VARCHAR2, p_hasta_maquina VARCHAR2, p_desde_of VARCHAR2, p_hasta_of VARCHAR2,
                                  p_desde_fecha_aux VARCHAR2, p_hasta_fecha_aux VARCHAR2, p_desde_seccion VARCHAR2, p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2,
                                  p_hasta_tipo_maquina VARCHAR2, p_recalcular_al_mover BOOLEAN*/) RETURN VARCHAR2;
  
  FUNCTION es_simulacion_en_uso(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2) RETURN NUMBER;

  PROCEDURE guardar_datos_grafico;
  
  -- FUNCTION get_fecha_turno(p_codigo_org_planta VARCHAR2) RETURN pk_web_p_ccmaqs.r_turnos;
  
  FUNCTION get_hora_turno(p_codigo_org_planta VARCHAR2, p_empresa VARCHAR2) RETURN VARCHAR2;
  
  FUNCTION get_dias_semana_turno(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN VARCHAR2;
  
  FUNCTION devuelve_fecha_fin_calendario(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fin VARCHAR2) RETURN VARCHAR2;
  
  --FUNCTION devuelve_fechas_iniciales(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN VARCHAR2;

  FUNCTION actualizar_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2) RETURN VARCHAR2;

  FUNCTION numero_secuencias_of(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER) RETURN NUMBER;

  FUNCTION get_fechas_secuencia(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN VARCHAR2;

END pk_web_p_ccmaqs_xe;
/
CREATE OR REPLACE PACKAGE BODY pk_web_p_ccmaqs_xe AS

  -- obtener tareas
  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2) RETURN tp_of
    PIPELINED IS
    rec          pk_web_p_ccmaqs.r_of;
    v_tt_recurso pk_web_p_ccmaqs.tt_of;
  BEGIN
    v_tt_recurso := pk_web_p_ccmaqs.get_ofs_graph(p_codigo_simulacion, p_codigo_org_planta, p_fecha_fabricacion_hasta, p_fecha_fabricacion_desde);
  
    FOR i IN 1 .. NVL(v_tt_recurso.last, 0) LOOP
      rec.id_sesion := v_tt_recurso(i).id_sesion;
      rec.codigo_org_planta := v_tt_recurso(i).codigo_org_planta;
      rec.numero_simulacion := v_tt_recurso(i).numero_simulacion;
      rec.orden_de_fabricacion := v_tt_recurso(i).orden_de_fabricacion;
      rec.secuencia := v_tt_recurso(i).secuencia;
      rec.fase := v_tt_recurso(i).fase;
      rec.linea := v_tt_recurso(i).linea;
      rec.codigo_articulo := v_tt_recurso(i).codigo_articulo;
      rec.tipo := v_tt_recurso(i).tipo;
      rec.fecha_ini := v_tt_recurso(i).fecha_ini;
      rec.fecha_fin := v_tt_recurso(i).fecha_fin;
      rec.recurso := v_tt_recurso(i).recurso;
      rec.desc_recurso := v_tt_recurso(i).desc_recurso;
      rec.porc_completado := v_tt_recurso(i).porc_completado;
      rec.y := v_tt_recurso(i).y;
      rec.nexttask := v_tt_recurso(i).nexttask;
      rec.nextrecurso := v_tt_recurso(i).nextrecurso;
      rec.recurso_libra := v_tt_recurso(i).recurso_libra;
      PIPE ROW(rec);
    END LOOP;
  
    RETURN;
  END get_ofs_graph;
  
  -- borra y recrea las tablas
  PROCEDURE rehacer_tablas(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                        p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2,/* p_fecha_fabricacion_hasta VARCHAR2, p_fecha_fabricacion_desde VARCHAR2, */p_desde_seccion VARCHAR2,
                        p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) IS
    BEGIN
    pk_web_p_ccmaqs.rehacer_tablas(p_codigo_simulacion, p_codigo_org_planta, p_codigo_empresa, p_hasta_proyecto, p_desde_proyecto, p_maquina_hasta,
                        p_maquina_desde, p_of_hasta, p_of_desde,/* p_fecha_fabricacion_hasta, p_fecha_fabricacion_desde, */p_desde_seccion,
                        p_hasta_seccion, p_desde_tipo_maquina, p_hasta_tipo_maquina);
  END rehacer_tablas;

  -- obtener recursos
  FUNCTION get_recursos_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN tp_recurso
    PIPELINED    IS 
    rec pk_web_p_ccmaqs.r_recurso;
    v_tt_recurso pk_web_p_ccmaqs.tt_recurso;
  BEGIN
    v_tt_recurso := pk_web_p_ccmaqs.get_recursos_graph(p_codigo_simulacion, p_codigo_org_planta);
  
    FOR i IN 1 .. NVL(v_tt_recurso.last, 0) LOOP
      rec.recurso_libra := v_tt_recurso(i).recurso_libra;
      rec.desc_recurso := v_tt_recurso(i).desc_recurso;      
      PIPE ROW(rec);
    END LOOP;
  
    RETURN;
  END get_recursos_graph;
  
  -- mover tarea y cambiar fecha_fin sin recalcular
  FUNCTION actualizar_datos_tarea_con_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2, p_fecha_fin VARCHAR2) RETURN VARCHAR2 IS
    v_result VARCHAR2(50);
  BEGIN
    v_result := pk_web_p_ccmaqs.actualizar_datos_tarea_con_fecha_fin(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, p_fecha_inicio, p_fecha_fin);
    RETURN v_result;
  END actualizar_datos_tarea_con_fecha_fin;
  
  -- mover tarea
  FUNCTION actualizar_datos_tarea(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2
                                   /*, p_cambio_recurso BOOLEAN,
                                                                    p_desde_proyecto VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_maquina VARCHAR2, p_hasta_maquina VARCHAR2, p_desde_of VARCHAR2, p_hasta_of VARCHAR2,
                                                                    p_desde_fecha_aux VARCHAR2, p_hasta_fecha_aux VARCHAR2, p_desde_seccion VARCHAR2, p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2,
                                                                    p_hasta_tipo_maquina VARCHAR2, p_recalcular_al_mover BOOLEAN*/) RETURN VARCHAR2 IS
    v_result VARCHAR2(50);
  BEGIN
    v_result := pk_web_p_ccmaqs.actualizar_datos_tarea(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, p_fecha_inicio
                                                        /*, p_cambio_recurso, p_desde_proyecto, p_hasta_proyecto,
                                                                                              p_desde_maquina, p_hasta_maquina, p_desde_of, p_hasta_of, p_desde_fecha_aux, p_hasta_fecha_aux, p_desde_seccion, p_hasta_seccion, p_desde_tipo_maquina,
                                                                                              p_hasta_tipo_maquina, p_recalcular_al_mover*/);
    RETURN v_result;
  END actualizar_datos_tarea;
  
  -- comprueba si la simulacion esta en uso
  FUNCTION es_simulacion_en_uso(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2) RETURN NUMBER IS
    v_en_uso NUMBER;
  BEGIN
    v_en_uso := pk_web_p_ccmaqs.es_simulacion_en_uso(p_empresa, p_codigo_org_planta, p_codigo_simulacion);
    RETURN v_en_uso;
  END es_simulacion_en_uso;
  
  -- guarda los datos modificados del gráfico a la tabla sch_of_rutas
  PROCEDURE guardar_datos_grafico IS
  BEGIN
    pk_web_p_ccmaqs.guardar_datos_grafico();
  END guardar_datos_grafico;

  -- Devuelve hora ini y fin del turno
  FUNCTION get_hora_turno(p_codigo_org_planta VARCHAR2, p_empresa VARCHAR2) RETURN VARCHAR2 IS
    v_turnos pk_web_p_ccmaqs.r_turnos;
    v_result VARCHAR2(50);
  BEGIN
    v_turnos := pk_web_p_ccmaqs.get_hora_turno(p_codigo_org_planta, p_empresa);
    v_result := TO_CHAR(v_turnos.hora_ini_turno, 'HH24:MI:SS') || '-' || TO_CHAR(v_turnos.hora_fin_turno, 'HH24:MI:SS');
    RETURN v_result;
  END get_hora_turno;
  
  -- Devuelve días de la semana y marca si son o no laborables
  FUNCTION get_dias_semana_turno(p_empresa VARCHAR2, p_codigo_org_planta VARCHAR2) RETURN VARCHAR2 IS
    v_turnos pk_web_p_ccmaqs.r_dias_semana;
    v_result VARCHAR2(50);
  BEGIN
    v_turnos := pk_web_p_ccmaqs.get_dias_semana_turno(p_empresa, p_codigo_org_planta);
    v_result := v_turnos.lunes || '-' || v_turnos.martes || '-' || v_turnos.miercoles || '-' || v_turnos.jueves || '-' || v_turnos.viernes || '-' || v_turnos.sabado || '-' || v_turnos.domingo;
    RETURN v_result;
  END get_dias_semana_turno;
  
  -- Devuelve la fecha fin calculada a partir del calendario de la planta
  FUNCTION devuelve_fecha_fin_calendario(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_fecha_fin VARCHAR2) RETURN VARCHAR2 IS
    v_result VARCHAR2(30);
    v_fecha_fin DATE;
  BEGIN
    v_fecha_fin := TO_DATE(p_fecha_fin, 'DD-MM-YYYY HH24:MI:SS');
    v_result := pk_web_p_ccmaqs.devuelve_fecha_fin_calendario(p_codigo_empresa, p_codigo_org_planta, v_fecha_fin);
    RETURN v_result;
  END devuelve_fecha_fin_calendario;
  
  -- Devuelve fechas iniciales antes de mover la tarea
 /* FUNCTION devuelve_fechas_iniciales(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN VARCHAR2 IS
    v_result VARCHAR2(40);
  BEGIN
    v_result := pk_web_p_ccmaqs.devuelve_fechas_iniciales(p_codigo_empresa, p_codigo_org_planta, p_numero_simulacion, p_orden_de_fabricacion, p_secuencia);
    RETURN v_result;
  END devuelve_fechas_iniciales;*/
  
  -- Calcula la fecha fin a partir de la posición de fecha_ini y la devuelve 
  FUNCTION actualizar_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2) RETURN VARCHAR2 IS
    v_fecha_ini DATE := TO_DATE(p_fecha_inicio, 'DD-MM-YYYY HH24:MI:SS');
    v_fecha_fin VARCHAR2(40);
  BEGIN
    v_fecha_fin := pk_web_p_ccmaqs.actualizar_fecha_fin(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia, v_fecha_ini);
    RETURN v_fecha_fin;
  END actualizar_fecha_fin;
  
  -- Devuelve el número de secuencias en la of pasada por parámetro. Mínimo 1.
  FUNCTION numero_secuencias_of(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER) RETURN NUMBER IS
    v_result NUMBER;
  BEGIN
    v_result := pk_web_p_ccmaqs.numero_secuencias_of(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion);
    RETURN v_result;
  END numero_secuencias_of;
  
  -- Devuelve las fechas de la secuencia de la OF
  FUNCTION get_fechas_secuencia(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER) RETURN VARCHAR2 IS
    v_result VARCHAR2(80);
  BEGIN
    v_result := pk_web_p_ccmaqs.get_fechas_secuencia(p_empresa, p_planta, p_simulacion, p_orden_de_fabricacion, p_secuencia);
    RETURN v_result;
  END get_fechas_secuencia;

END pk_web_p_ccmaqs_xe;
/
