SELECT tiempo_fin
  FROM sch_calculo
 WHERE num_of = 70
   AND secuencia = 2
   AND codigo_simulacion = '1'
   AND codigo_empresa = '03';
   
   SELECT *
  FROM sch_calculo
   
    SELECT tiempo_fin
          INTO v_fin_fase
          FROM sch_calculo
         WHERE num_of =  70 -- p_num_of
           AND secuencia = 1 -- p_secuencia
           AND codigo_simulacion = '1' --p_codigo_simulacion
           AND codigo_empresa = '03'; -- p_codigo_empresa;
           
            SELECT tiempo_fin
    
          FROM sch_calculo
         WHERE num_of =  70 -- p_num_of
           AND secuencia = 1 -- p_secuencia
           AND codigo_simulacion = '1' --p_codigo_simulacion
           AND codigo_empresa = '03'; -- p_codigo_empresa;
   
   
/* SELECT p.factor_convs_horas
      FROM organizacion_plantas p
     WHERE codigo_empresa = '03'
       AND codigo_org_planta = '01';*/
   
 
 -- pk_web_p_ccmaqs.actualizar_datos_tarea('03', '01', '1', 70, 1, '25/10/2023 04:38:00', FALSE, NULL, NULL, NULL, NULL, NULL, NULL,
                                          --         '25/10/2023 03:00:00', '25/10/2023 06:00:00', NULL, NULL, NULL, NULL, TRUE);
                                          
 /*
 FUNCTION actualizar_datos_tarea(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2,
                                  p_cambio_recurso BOOLEAN,
                                  p_desde_proyecto VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_maquina VARCHAR2, p_hasta_maquina VARCHAR2, p_desde_of VARCHAR2, p_hasta_of VARCHAR2,
                                  p_desde_fecha_aux VARCHAR2, p_hasta_fecha_aux VARCHAR2, p_desde_seccion VARCHAR2, p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2,
                                  p_hasta_tipo_maquina VARCHAR2, p_recalcular_al_mover BOOLEAN)
 */
 
 select * from sch_grafico_proyectos for update;
 
 select * from sch_grafico_recursos for update;
