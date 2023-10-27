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

  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                         p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                         p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tp_of
    PIPELINED;
    
 -- PROCEDURE delete_tables_from_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2);

END pk_web_p_ccmaqs_xe;
/
CREATE OR REPLACE PACKAGE BODY pk_web_p_ccmaqs_xe AS

  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                         p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                         p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tp_of
    PIPELINED IS
    rec     pk_web_p_ccmaqs.r_of;
    v_tt_of pk_web_p_ccmaqs.tt_of;
  BEGIN
    v_tt_of := pk_web_p_ccmaqs.get_ofs_graph(p_codigo_simulacion, p_codigo_org_planta, p_codigo_empresa, p_hasta_proyecto, p_desde_proyecto, p_maquina_hasta, p_maquina_desde, p_of_hasta, p_of_desde,
                                             p_fecha_fabricacion_hasta, p_fecha_fabricacion_desde, p_desde_seccion, p_hasta_seccion, p_desde_tipo_maquina, p_hasta_tipo_maquina);
  
    FOR i IN 1 .. NVL(v_tt_of.last, 0) LOOP
      rec.codigo_org_planta := v_tt_of(i).codigo_org_planta;
      rec.numero_simulacion := v_tt_of(i).numero_simulacion;
      rec.orden_de_fabricacion := v_tt_of(i).orden_de_fabricacion;
      rec.secuencia := v_tt_of(i).secuencia;
      rec.fase := v_tt_of(i).fase;
      rec.linea := v_tt_of(i).linea;
      rec.tipo := v_tt_of(i).tipo;
      rec.fecha_ini := v_tt_of(i).fecha_ini;
      rec.fecha_fin := v_tt_of(i).fecha_fin;
      rec.recurso := v_tt_of(i).recurso;
      rec.desc_recurso := v_tt_of(i).desc_recurso;
      rec.porc_completado := v_tt_of(i).porc_completado;
      PIPE ROW(rec);
    END LOOP;
  
    RETURN;
  END get_ofs_graph;
  
  
  /*PROCEDURE delete_tables_from_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2) IS
    pk_web_p_ccmaqs.delete_tables_from_graph(p_codigo_simulacion, p_codigo_org_planta, p_codigo_empresa);
  END delete_tables_from_graph;*/


END pk_web_p_ccmaqs_xe;
/
