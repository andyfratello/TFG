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
    codigo_org_planta    VARCHAR2(5),
    numero_simulacion    VARCHAR2(20),
    orden_de_fabricacion NUMBER(10),
    secuencia            NUMBER(4),
    fase                 NUMBER(3),
    linea                NUMBER(4),
    tipo                 VARCHAR2(1),
    fecha_ini            VARCHAR2(20),
    fecha_fin            VARCHAR2(20),
    recurso              VARCHAR2(100),
    desc_recurso         VARCHAR2(500),
    porc_completado      NUMBER(5));

  TYPE tt_of IS TABLE OF r_of INDEX BY BINARY_INTEGER;

  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                         p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                         p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tt_of;
                         
  --PROCEDURE delete_tables_from_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2);

END pk_web_p_ccmaqs;
/
CREATE OR REPLACE PACKAGE BODY pk_web_p_ccmaqs AS

  --v_id_sesion VARCHAR2(100);

  FUNCTION get_ofs_graph(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                         p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_desde_seccion VARCHAR2,
                         p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) RETURN tt_of IS
    mytable tt_of;
  
  BEGIN
  
    /*SELECT smproductsequence.nextval
      INTO v_id_sesion
      FROM dual;
  
    sch_carga_maquinas.prepara_grafico(p_codigo_simulacion, p_codigo_org_planta, p_codigo_empresa, p_hasta_proyecto, p_desde_proyecto, p_maquina_hasta, p_maquina_desde, p_of_hasta, p_of_desde,
                                       TO_DATE(p_fecha_fabricacion_hasta, 'DD/MM/YYYY'), TO_DATE(p_fecha_fabricacion_desde, 'DD/MM/YYYY'), v_id_sesion, p_desde_seccion, p_hasta_seccion,
                                       p_desde_tipo_maquina, p_hasta_tipo_maquina);
  
    sch_carga_maquinas.calcula_carga_maquinas(p_codigo_empresa, p_codigo_org_planta, p_codigo_simulacion, v_id_sesion);
  
    COMMIT;*/
  
    mytable := tt_of();

    FOR c IN (SELECT
                  c.codigo_org_planta,
                  c.numero_simulacion,
                  c.orden_de_fabricacion,
                  c.secuencia,
                  c.fase,
                  c.linea,
                  c.tipo,
                  TO_CHAR(c.fecha_ini, 'YYYY-MM-DD HH24:MI') as fecha_ini,
                  TO_CHAR(c.fecha_fin, 'YYYY-MM-DD HH24:MI') as fecha_fin,
                  c.recurso,
                  c.desc_recurso,
                  c.porc_completado
                FROM sch_grafico_proyectos c
               WHERE c.codigo_org_planta = p_codigo_org_planta
                 AND c.numero_simulacion = p_codigo_simulacion) LOOP
      mytable(mytable.count + 1) := pk_web_p_ccmaqs.r_of(c.codigo_org_planta, c.numero_simulacion, c.orden_de_fabricacion, c.secuencia, c.fase, c.linea, c.tipo, c.fecha_ini, c.fecha_fin, c.recurso, c.desc_recurso, c.porc_completado);
    END LOOP;

  /*
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
  
    COMMIT;
  */
    RETURN mytable;
  
  END get_ofs_graph;

END pk_web_p_ccmaqs;
/
