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

  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                         p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                         p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tp_of
    PIPELINED;

  FUNCTION get_recursos_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                              p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                              p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tp_recurso
    PIPELINED;
    
    
  PROCEDURE mover_tarea(p_fecha_ini_prevista VARCHAR2, p_fecha_fin_prevista VARCHAR2);
  
  PROCEDURE actualiza_porc_completado(p_codigo_simulacion VARCHAR2, p_porc_completado VARCHAR2);

END pk_web_p_ccmaqs_xe;
/
CREATE OR REPLACE PACKAGE BODY pk_web_p_ccmaqs_xe AS

  -- obtener tareas
  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                         p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                         p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tp_of
    PIPELINED IS
    rec          pk_web_p_ccmaqs.r_of;
    v_tt_recurso pk_web_p_ccmaqs.tt_of;
  BEGIN
    v_tt_recurso := pk_web_p_ccmaqs.get_ofs_graph(p_codigo_simulacion, p_codigo_org_planta, p_codigo_empresa, p_hasta_proyecto, p_desde_proyecto, p_maquina_hasta, p_maquina_desde, p_of_hasta,
                                                  p_of_desde, p_fecha_fabricacion_hasta, p_fecha_fabricacion_desde, p_desde_seccion, p_hasta_seccion, p_desde_tipo_maquina, p_hasta_tipo_maquina);
  
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

  -- obtener recursos
  FUNCTION get_recursos_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                              p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                              p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tp_recurso
    PIPELINED    IS 
    rec pk_web_p_ccmaqs.r_recurso;
    v_tt_recurso pk_web_p_ccmaqs.tt_recurso;
  BEGIN
    v_tt_recurso := pk_web_p_ccmaqs.get_recursos_graph(p_codigo_simulacion, p_codigo_org_planta, p_codigo_empresa, p_hasta_proyecto, p_desde_proyecto, p_maquina_hasta, p_maquina_desde, p_of_hasta,
                                                       p_of_desde, p_fecha_fabricacion_hasta, p_fecha_fabricacion_desde, p_desde_seccion, p_hasta_seccion, p_desde_tipo_maquina, p_hasta_tipo_maquina);
  
    FOR i IN 1 .. NVL(v_tt_recurso.last, 0) LOOP
      rec.orden_de_fabricacion := v_tt_recurso(i).orden_de_fabricacion;
      rec.secuencia := v_tt_recurso(i).secuencia;
      rec.codigo_articulo := v_tt_recurso(i).codigo_articulo;
      rec.recurso := v_tt_recurso(i).recurso;
      rec.desc_recurso := v_tt_recurso(i).desc_recurso;
      rec.y := v_tt_recurso(i).y;
      rec.nexttask := v_tt_recurso(i).nexttask;
      rec.nextrecurso := v_tt_recurso(i).nextrecurso;
      rec.recurso_libra := v_tt_recurso(i).recurso_libra;
      PIPE ROW(rec);
    END LOOP;
  
    RETURN;
  END get_recursos_graph;
  
  -- mover tarea
  PROCEDURE mover_tarea(p_fecha_ini_prevista VARCHAR2, p_fecha_fin_prevista VARCHAR2) IS
  BEGIN
    pk_web_p_ccmaqs.mover_tarea(p_fecha_ini_prevista, p_fecha_fin_prevista);
  END mover_tarea;
  
  -- actualiza porcentaje completado
  PROCEDURE actualiza_porc_completado(p_codigo_simulacion VARCHAR2, p_porc_completado VARCHAR2) IS
  BEGIN
    pk_web_p_ccmaqs.actualiza_porc_completado(p_codigo_simulacion VARCHAR2, p_porc_completado VARCHAR2);
  END actualiza_porc_completado;

END pk_web_p_ccmaqs_xe;
/
