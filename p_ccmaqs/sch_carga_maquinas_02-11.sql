CREATE OR REPLACE PACKAGE sch_carga_maquinas IS
  /*$PNTPKLIB$ASIDE%CTRL(FTES:00003:*/

  PROCEDURE generar_simulacion(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2, p_cabecera BOOLEAN);
  FUNCTION consulta_status_actividad(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_fase NUMBER, p_secuencia NUMBER)
    RETURN NUMBER;
  PROCEDURE cambia_status_actividad(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_fase NUMBER, p_secuencia NUMBER,
                                    p_marcar BOOLEAN);
  PROCEDURE actualiza_datos(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_orden_de_fabricacion NUMBER, p_num_linea_ruta NUMBER, p_codigo_simulacion VARCHAR2, p_fase NUMBER,
                            p_secuencia NUMBER, p_id_sesion NUMBER);
  PROCEDURE calcula_carga_maquinas(p_empresa VARCHAR2, p_planta VARCHAR2, p_simu VARCHAR2, p_id_sesion NUMBER);
  FUNCTION calcula_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2, p_cambio_recurso BOOLEAN,
                             p_desde_proyecto VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_maquina VARCHAR2, p_hasta_maquina VARCHAR2, p_desde_of VARCHAR2, p_hasta_of VARCHAR2,
                             p_desde_fecha_aux VARCHAR2, p_hasta_fecha_aux VARCHAR2, p_desde_seccion VARCHAR2, p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2,
                             p_recalcular_al_mover BOOLEAN) RETURN VARCHAR;
  FUNCTION recoloca_actividad(p_codigo_empresa VARCHAR2, p_planta VARCHAR2, p_planificacion VARCHAR2, p_codigo_simulacion VARCHAR2, p_num_of NUMBER, p_secuencia NUMBER, p_fini VARCHAR2,
                              p_mover_proyecto NUMBER) RETURN VARCHAR;
  PROCEDURE cambio_fecha_pedidos(p_empresa VARCHAR2);
  PROCEDURE cambio_fecha_solicitudes(p_empresa VARCHAR2);
  PROCEDURE actualiza_porc_completado(p_codigo_simulacion VARCHAR2, p_id_sesion NUMBER);
  PROCEDURE prepara_grafico(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                            p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_id_sesion NUMBER,
                            p_desde_seccion VARCHAR2, p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2);
  PROCEDURE cambia_nivel_visualizado(p_id_sesion NUMBER, p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_nivel NUMBER);
END sch_carga_maquinas;
/
CREATE OR REPLACE PACKAGE BODY sch_carga_maquinas IS
  PROCEDURE generar_simulacion(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2, p_cabecera BOOLEAN) IS
    v_tipo_periodo_fabricacion organizacion_plantas.tipo_periodo_fabricacion%TYPE;
  BEGIN
    SELECT tipo_periodo_fabricacion
      INTO v_tipo_periodo_fabricacion
      FROM organizacion_plantas
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta;

    -- REALIZAMOS EL UPDATE EN LA TABLA SCH_OF_RUTAS A PARTIR DE LA SIMULACION QUE HEMOS MODIFICADO
    UPDATE ordenes_fabrica_rutas ofr
       SET ofr.fecha_ini_prevista =
           (SELECT sor.fecha_ini_prevista
              FROM sch_of_rutas sor
             WHERE sor.codigo_empresa = ofr.codigo_empresa
               AND sor.codigo_org_planta = ofr.codigo_org_planta
               AND sor.codigo_simulacion = p_codigo_simulacion
               AND sor.orden_de_fabricacion = ofr.orden_de_fabricacion
               AND sor.numero_secuencia_fabricacion = ofr.numero_secuencia_fabricacion
               AND sor.num_linea_ruta = ofr.num_linea_ruta),
           ofr.fecha_fin_prevista =
           (SELECT sor.fecha_fin_prevista
              FROM sch_of_rutas sor
             WHERE sor.codigo_empresa = ofr.codigo_empresa
               AND sor.codigo_org_planta = ofr.codigo_org_planta
               AND sor.codigo_simulacion = p_codigo_simulacion
               AND sor.orden_de_fabricacion = ofr.orden_de_fabricacion
               AND sor.numero_secuencia_fabricacion = ofr.numero_secuencia_fabricacion
               AND sor.num_linea_ruta = ofr.num_linea_ruta),
           ofr.codigo_maquina =
           (SELECT sor.codigo_maquina
              FROM sch_of_rutas sor
             WHERE sor.codigo_empresa = ofr.codigo_empresa
               AND sor.codigo_org_planta = ofr.codigo_org_planta
               AND sor.codigo_simulacion = p_codigo_simulacion
               AND sor.orden_de_fabricacion = ofr.orden_de_fabricacion
               AND sor.numero_secuencia_fabricacion = ofr.numero_secuencia_fabricacion
               AND sor.num_linea_ruta = ofr.num_linea_ruta)
     WHERE ofr.codigo_empresa = p_codigo_empresa
       AND ofr.codigo_org_planta = p_codigo_org_planta
       AND EXISTS (SELECT 1
              FROM sch_grafico_proyectos sgp
             WHERE sgp.codigo_empresa = ofr.codigo_empresa
               AND sgp.codigo_org_planta = ofr.codigo_org_planta
               AND sgp.orden_de_fabricacion = ofr.orden_de_fabricacion
               AND sgp.numero_simulacion = p_codigo_simulacion);

    IF p_cabecera = TRUE THEN
      UPDATE ordenes_fabrica_cab ofc
         SET ofc.fecha_ini_fabri_prevista =
             (SELECT MIN(sor.fecha_ini_prevista)
                FROM sch_of_rutas sor
               WHERE sor.codigo_empresa = ofc.codigo_empresa
                 AND sor.codigo_org_planta = ofc.codigo_org_planta
                 AND sor.codigo_simulacion = p_codigo_simulacion
                 AND sor.orden_de_fabricacion = ofc.orden_de_fabricacion
                 AND sor.maq_asignada_en_calculo = 'S'),
             ofc.fecha_entrega_prevista =
             (SELECT MAX(sor.fecha_fin_prevista)
                FROM sch_of_rutas sor
               WHERE sor.codigo_empresa = ofc.codigo_empresa
                 AND sor.codigo_org_planta = ofc.codigo_org_planta
                 AND sor.codigo_simulacion = p_codigo_simulacion
                 AND sor.orden_de_fabricacion = ofc.orden_de_fabricacion
                 AND sor.maq_asignada_en_calculo = 'S'),
             ofc.ejercicio_periodo = ejercicio_periodo((SELECT MAX(sor.fecha_fin_prevista)
                                                         FROM sch_of_rutas sor
                                                        WHERE sor.codigo_empresa = ofc.codigo_empresa
                                                          AND sor.codigo_org_planta = ofc.codigo_org_planta
                                                          AND sor.codigo_simulacion = p_codigo_simulacion
                                                          AND sor.orden_de_fabricacion = ofc.orden_de_fabricacion
                                                          AND sor.maq_asignada_en_calculo = 'S'), v_tipo_periodo_fabricacion, 'E'),
             ofc.num_periodo = ejercicio_periodo((SELECT MAX(sor.fecha_fin_prevista)
                                                   FROM sch_of_rutas sor
                                                  WHERE sor.codigo_empresa = ofc.codigo_empresa
                                                    AND sor.codigo_org_planta = ofc.codigo_org_planta
                                                    AND sor.codigo_simulacion = p_codigo_simulacion
                                                    AND sor.orden_de_fabricacion = ofc.orden_de_fabricacion
                                                    AND sor.maq_asignada_en_calculo = 'S'), v_tipo_periodo_fabricacion, 'P')
       WHERE ofc.codigo_empresa = p_codigo_empresa
         AND ofc.codigo_org_planta = p_codigo_org_planta
         AND EXISTS (SELECT 1
                FROM sch_of_rutas sor
               WHERE sor.codigo_empresa = ofc.codigo_empresa
                 AND sor.codigo_org_planta = ofc.codigo_org_planta
                 AND sor.orden_de_fabricacion = ofc.orden_de_fabricacion
                 AND sor.codigo_simulacion = p_codigo_simulacion
                 AND sor.maq_asignada_en_calculo = 'S')
         AND EXISTS (SELECT 1
                FROM sch_grafico_proyectos sgp
               WHERE sgp.codigo_empresa = ofc.codigo_empresa
                 AND sgp.codigo_org_planta = ofc.codigo_org_planta
                 AND sgp.orden_de_fabricacion = ofc.orden_de_fabricacion
                 AND sgp.numero_simulacion = p_codigo_simulacion);
    END IF;

    COMMIT;
  END;

  FUNCTION consulta_status_actividad(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_fase NUMBER, p_secuencia NUMBER)
    RETURN NUMBER IS
    v_fijada NUMBER;
  BEGIN
    BEGIN
      SELECT DECODE(NVL(ofr.fijada, 'N'), 'S', 1, 'N', 0, 0)
        INTO v_fijada
        FROM sch_of_rutas ofr
       WHERE ofr.codigo_empresa = p_codigo_empresa
         AND ofr.codigo_simulacion = p_codigo_simulacion
         AND ofr.codigo_org_planta = p_codigo_org_planta
         AND ofr.orden_de_fabricacion = p_orden_de_fabricacion
         AND ofr.fase = p_fase
         AND ofr.numero_secuencia_fabricacion = p_secuencia;
    EXCEPTION
      WHEN NO_DATA_FOUND OR TOO_MANY_ROWS THEN
        v_fijada := 0;
    END;

    RETURN v_fijada;
  EXCEPTION
    WHEN OTHERS THEN
      pkpantallas.log(SQLERRM || ', p_codigo_empresa: ' || p_codigo_empresa || ', p_codigo_org_planta: ' || p_codigo_org_planta || ', p_codigo_simulacion: ' || p_codigo_simulacion ||
                      ', p_orden_de_fabricacion: ' || TO_CHAR(p_orden_de_fabricacion) || ', p_fase: ' || TO_CHAR(p_fase) || ', p_secuencia: ' || TO_CHAR(p_secuencia), $$PLSQL_UNIT,
                      'CONSULTA_STATUS_ACTIVIDAD');
      RAISE;
  END consulta_status_actividad;

  PROCEDURE cambia_status_actividad(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_fase NUMBER, p_secuencia NUMBER,
                                    p_marcar BOOLEAN) IS
    v_fijada sch_of_rutas.fijada%TYPE;
  BEGIN

    IF p_marcar THEN
      v_fijada := 'S';
    ELSE
      v_fijada := 'N';
    END IF;

    UPDATE sch_of_rutas ofc
       SET fijada = v_fijada
     WHERE ofc.codigo_empresa = p_codigo_empresa
       AND ofc.codigo_simulacion = p_codigo_simulacion
       AND ofc.codigo_org_planta = p_codigo_org_planta
       AND ofc.orden_de_fabricacion = p_orden_de_fabricacion
       AND ofc.fase = p_fase
       AND ofc.numero_secuencia_fabricacion = p_secuencia;

    COMMIT;
  END;

  PROCEDURE actualiza_datos(p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_orden_de_fabricacion NUMBER, p_num_linea_ruta NUMBER, p_codigo_simulacion VARCHAR2, p_fase NUMBER,
                            p_secuencia NUMBER, p_id_sesion NUMBER) IS
    p_recurso      sch_grafico_recursos.recurso%TYPE;
    v_desc_maquina VARCHAR2(100);
  BEGIN
    SELECT SUBSTR(recurso, 0, INSTR(recurso, ':') - 1)
      INTO p_recurso
      FROM sch_grafico_recursos
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_codigo_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND secuencia = p_secuencia
       AND id_sesion = p_id_sesion;

    UPDATE sch_grafico_recursos
       SET recurso_libra = p_recurso
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_codigo_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND secuencia = p_secuencia
       AND id_sesion = p_id_sesion;

    UPDATE sch_of_rutas
       SET codigo_maquina = p_recurso
     WHERE codigo_simulacion = p_codigo_simulacion
       AND codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND num_linea_ruta = p_num_linea_ruta
       AND numero_secuencia_fabricacion = p_secuencia;

    UPDATE sch_actividades
       SET maquina = p_recurso
     WHERE num_of = p_orden_de_fabricacion
       AND fase = p_fase
       AND codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND codigo_simulacion = p_codigo_simulacion
       AND secuencia = p_secuencia;

    UPDATE sch_calculo
       SET recurso = p_recurso
     WHERE num_of = p_orden_de_fabricacion
       AND fase = p_fase
       AND codigo_simulacion = p_codigo_simulacion
       AND secuencia = p_secuencia
       AND codigo_empresa = p_codigo_empresa;

    -- DPF 19/10/2010  ACTUALIZO EL GRÁFICO DE PROYECTOS----------------------
    SELECT desc_maquina
      INTO v_desc_maquina
      FROM maquinas
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND codigo_maquina = p_recurso;

    UPDATE sch_grafico_proyectos
       SET recurso = SUBSTR(SUBSTR(recurso, 0, INSTR(recurso, ':')) || ' ' || v_desc_maquina, 0, 20),
           desc_recurso = v_desc_maquina
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_codigo_simulacion
       AND orden_de_fabricacion = p_orden_de_fabricacion
       AND secuencia = p_secuencia
       AND id_sesion = p_id_sesion;

    --------------------------------------------------------------------------
    COMMIT;
  END;

  PROCEDURE calcula_carga_maquinas(p_empresa VARCHAR2, p_planta VARCHAR2, p_simu VARCHAR2, p_id_sesion NUMBER) IS
    v_inicio_horizonte  sch_calculo_cab.inicio_horizonte%TYPE;
    v_f_ini             DATE;
    v_f_fin             DATE;
    v_codigo_calendario sch_calculo_cab.codigo_calendario%TYPE;

    CURSOR c1 IS
      SELECT *
        FROM sch_grafico_carga_recursos
       WHERE codigo_empresa = p_empresa
         AND codigo_org_planta = p_planta
         AND codigo_simulacion = p_simu
         AND id_sesion = p_id_sesion
         FOR UPDATE;
  BEGIN
    SELECT c.inicio_horizonte, codigo_calendario
      INTO v_inicio_horizonte, v_codigo_calendario
      FROM sch_calculo_cab c
     WHERE c.codigo_simulacion = p_simu
       AND c.codigo_empresa = p_empresa;

    /*
          SELECT MIN (TRUNC (  (tiempo_prod / 1440)
                             - FLOOR (tiempo_prod / 1440)
                             + TO_DATE ((  v_inicio_horizonte
                                         + FLOOR (tiempo_prod / 1440)
                                        ),
                                        'J'
                                       )
                            )
                     ),
                 MAX (TRUNC (  (tiempo_fin / 1440)
                             - FLOOR (tiempo_fin / 1440)
                             + TO_DATE ((  v_inicio_horizonte
                                         + FLOOR (tiempo_fin / 1440)
                                        ),
                                        'J'
                                       )
                            )
                     )
            INTO v_f_ini,
                 v_f_fin
            FROM sch_calculo c
           WHERE c.codigo_simulacion = p_simu AND c.codigo_empresa = p_empresa;
    */
    SELECT MIN(TRUNC(fecha_ini)), MAX(TRUNC(fecha_fin))
      INTO v_f_ini, v_f_fin
      FROM sch_grafico_proyectos c
     WHERE c.numero_simulacion = p_simu
       AND c.codigo_empresa = p_empresa
       AND id_sesion = p_id_sesion;

    DELETE FROM sch_grafico_carga_recursos
     WHERE codigo_empresa = p_empresa
       AND codigo_org_planta = p_planta
       AND codigo_simulacion = p_simu
       AND id_sesion = p_id_sesion;

    INSERT INTO sch_grafico_carga_recursos
      (codigo_empresa, codigo_org_planta, codigo_simulacion, recurso, desc_recurso, fecha, carga_horas, porcentaje_carga, mostrar, total_capacidad, id_sesion)
      SELECT r.codigo_empresa_conta, r.codigo_org_planta, p_simu, r.recurso, NULL, fecha_del_mes,
             /* SUM     mmc 13/07/11: no funciona bien con carga finita
                                                                                                                                                                    (DECODE
                                                                                                                                                                        (  NVL (l.hora_inicio_turno1, 0)
                                                                                                                                                                         + NVL (l.hora_inicio_turno2, 0)
                                                                                                                                                                         + NVL (l.hora_inicio_turno3, 0),
                                                                                                                                                                         0, 0,
                                                                                                                                                                         NVL
                                                                                                                                                                            (  (SELECT COUNT (*)
                                                                                                                                                                                  FROM sch_calculo c
                                                                                                                                                                                 WHERE c.codigo_empresa = l.codigo_empresa
                                                                                                                                                                                   AND c.codigo_simulacion = p_simu
                                                                                                                                                                                   AND c.recurso = l.codigo_maquina
                                                                                                                                                                                   AND num_of > 0
                                                                                                                                                                                   AND l.fecha_del_mes
                                                                                                                                                                                          BETWEEN TRUNC
                                                                                                                                                                                                    (  (tiempo_prod / 1440)
                                                                                                                                                                                                     - FLOOR (  tiempo_prod
                                                                                                                                                                                                              / 1440
                                                                                                                                                                                                             )
                                                                                                                                                                                                     + TO_DATE
                                                                                                                                                                                                          ((  v_inicio_horizonte
                                                                                                                                                                                                            + FLOOR
                                                                                                                                                                                                                 (  tiempo_prod
                                                                                                                                                                                                                  / 1440
                                                                                                                                                                                                                 )
                                                                                                                                                                                                           ),
                                                                                                                                                                                                           'J'
                                                                                                                                                                                                          )
                                                                                                                                                                                                    )
                                                                                                                                                                                              AND TRUNC
                                                                                                                                                                                                    (  (tiempo_fin / 1440)
                                                                                                                                                                                                     - FLOOR (  tiempo_fin
                                                                                                                                                                                                              / 1440
                                                                                                                                                                                                             )
                                                                                                                                                                                                     + TO_DATE
                                                                                                                                                                                                          ((  v_inicio_horizonte
                                                                                                                                                                                                            + FLOOR
                                                                                                                                                                                                                 (  tiempo_fin
                                                                                                                                                                                                                  / 1440
                                                                                                                                                                                                                 )
                                                                                                                                                                                                           ),
                                                                                                                                                                                                           'J'
                                                                                                                                                                                                          )
                                                                                                                                                                                                    ))
                                                                                                                                                                             * r.horas_turno,
                                                                                                                                                                             0
                                                                                                                                                                            )
                                                                                                                                                                        )
                                                                                                                                                                    ) horas_maquina,
                                                                                                                                                                    */
             SUM((SELECT ROUND(LEAST(NVL(SUM(scal.tiempo_fin - scal.tiempo_ini) / 60, 0), (r.num_turno * r.horas_turno)), 1)
                    FROM sch_calculo scal, sch_calculo_cab scab
                   WHERE scal.codigo_empresa = scab.codigo_empresa
                     AND scal.codigo_simulacion = scab.codigo_simulacion
                     AND scal.codigo_simulacion = p_simu
                     AND scal.codigo_empresa = l.codigo_empresa
                     AND scal.recurso = l.codigo_maquina
                     AND l.fecha_del_mes BETWEEN TRUNC(TO_DATE(scab.inicio_horizonte, 'J') + scal.tiempo_ini / 1440) AND TRUNC(TO_DATE(scab.inicio_horizonte, 'J') + scal.tiempo_fin / 1440)
                     AND estado = 'O')) horas_maquina, 0, 'N', (r.capacidad_mano_obra * horas_turno * num_turno) / (100 / coef_mano_obra) total_capacidad, p_id_sesion
        FROM calendario_maquinas_l l, p_capacidad_recursos r
       WHERE l.codigo_empresa = p_empresa
         AND l.codigo_calendario = v_codigo_calendario
         AND l.codigo_org_planta = p_planta
         AND l.fecha_del_mes BETWEEN TRUNC(v_f_ini) AND TRUNC(v_f_fin)
         AND r.codigo_empresa_conta = l.codigo_empresa
         AND r.codigo_org_planta = l.codigo_org_planta
         AND r.recurso = l.codigo_maquina
         AND EXISTS (SELECT 1
                FROM sch_calculo cc
               WHERE cc.codigo_empresa = l.codigo_empresa
                 AND cc.codigo_simulacion = p_simu
                 AND cc.recurso = l.codigo_maquina)
       GROUP BY r.codigo_empresa_conta, r.codigo_org_planta, p_simu, r.recurso, fecha_del_mes, (r.capacidad_mano_obra * horas_turno * num_turno) / (100 / coef_mano_obra)
       ORDER BY r.recurso, l.fecha_del_mes;

    COMMIT;

    FOR x IN c1 LOOP
      UPDATE sch_grafico_carga_recursos
         SET porcentaje_carga =
             (x.carga_horas * 100) / x.total_capacidad
       WHERE CURRENT OF c1;
    END LOOP;

    COMMIT;
  END;

  FUNCTION calcula_fecha_fin(p_empresa VARCHAR2, p_planta VARCHAR2, p_simulacion VARCHAR2, p_orden_de_fabricacion NUMBER, p_secuencia NUMBER, p_fecha_inicio VARCHAR2, p_cambio_recurso BOOLEAN,
                             p_desde_proyecto VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_maquina VARCHAR2, p_hasta_maquina VARCHAR2, p_desde_of VARCHAR2, p_hasta_of VARCHAR2,
                             p_desde_fecha_aux VARCHAR2, p_hasta_fecha_aux VARCHAR2, p_desde_seccion VARCHAR2, p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2,
                             p_recalcular_al_mover BOOLEAN) RETURN VARCHAR IS
    CURSOR c_proyecto IS
      SELECT ofc.*, a.ciclo_produc
        FROM sch_of_cab ofc, articulos a
       WHERE ofc.codigo_empresa = p_empresa
         AND ofc.codigo_simulacion = p_simulacion
         AND ofc.codigo_org_planta = p_planta
         AND a.codigo_empresa = ofc.codigo_empresa
         AND a.codigo_articulo = ofc.codigo_articulo
         AND EXISTS (SELECT 1
                FROM sch_actividades sa
               WHERE sa.codigo_empresa = ofc.codigo_empresa
                 AND sa.codigo_org_planta = ofc.codigo_org_planta
                 AND sa.codigo_simulacion = ofc.codigo_simulacion
                 AND sa.num_of = ofc.orden_de_fabricacion
              CONNECT BY PRIOR sa.num_of = sa.num_of_padre
               START WITH sa.num_of_padre = p_orden_de_fabricacion)
       ORDER BY ofc.orden_de_fabricacion DESC;

    v_dummy_texto               VARCHAR2(1024);
    p_mover_proyecto            NUMBER := 0;
    v_id_sesion                 NUMBER;
    v_fecha_decalaje            ordenes_fabrica_cab.fecha_ini_fabri_prevista%TYPE;
    v_fecha_inicio              VARCHAR2(50);
    p_desde_fecha               DATE;
    p_hasta_fecha               DATE;
    v_ult_fase_of               ordenes_fabrica_rutas.fase%TYPE;
    v_ult_fase_gantt            ordenes_fabrica_rutas.fase%TYPE;
    v_error                     BOOLEAN;
    r_calculo_cab               sch_calculo_cab%ROWTYPE;
    v_factor_horas              organizacion_plantas.factor_convs_horas%TYPE;
    v_duracion_teorica_proyecto NUMBER;

  BEGIN
    IF pkpantallas.get_activada_traza() THEN
      pkpantallas.traza('p_empresa: ' || p_empresa || ', p_planta: ' || p_planta || ', p_simulacion: ' || p_simulacion || ', p_orden_de_fabricacion: ' || TO_CHAR(p_orden_de_fabricacion) ||
                        ', p_secuencia: ' || TO_CHAR(p_secuencia) || ', p_fecha_inicio: ' || p_fecha_inicio || ', p_cambio_recurso: ' || pkpantallas_aux.boolean2char(p_cambio_recurso) ||
                        ', p_desde_proyecto: ' || p_desde_proyecto || ', p_hasta_proyecto: ' || p_hasta_proyecto || ', p_desde_maquina: ' || p_desde_maquina || ', p_hasta_maquina: ' ||
                        p_hasta_maquina || ', p_desde_of: ' || p_desde_of || ', p_hasta_of: ' || p_hasta_of || ', p_desde_fecha_aux: ' || p_desde_fecha_aux || ', p_hasta_fecha_aux: ' ||
                        p_hasta_fecha_aux || ', p_desde_seccion: ' || p_desde_seccion || ', p_hasta_seccion: ' || p_hasta_seccion || ', p_desde_tipo_maquina: ' || p_desde_tipo_maquina ||
                        ', p_hasta_tipo_maquina: ' || p_hasta_tipo_maquina || ', p_recalcular_al_mover: ' || pkpantallas_aux.boolean2char(p_recalcular_al_mover), $$PLSQL_UNIT, 'CALCULA_FECHA_FIN',
                        'DEBUG');
    END IF;
    
    
    --p_desde_fecha := TO_DATE(p_desde_fecha_aux, 'DD/MM/YYYY');
    --p_hasta_fecha := TO_DATE(p_hasta_fecha_aux, 'DD/MM/YYYY');
    
    p_desde_fecha := TO_DATE(p_desde_fecha_aux, 'DD/MM/YYYY HH24:MI:SS');
    p_hasta_fecha := TO_DATE(p_hasta_fecha_aux, 'DD/MM/YYYY HH24:MI:SS');
    
    pkpantallas.log('Andreu 1: ' || p_desde_fecha_aux || ' --> ' || p_desde_fecha || ' i ' || p_hasta_fecha_aux || ' --> ' || p_hasta_fecha);

    SELECT MAX(ofr.fase) --MAX (ofr.numero_secuencia_fabricacion)
      INTO v_ult_fase_of
      FROM sch_of_rutas ofr
     WHERE ofr.codigo_empresa = p_empresa
       AND ofr.codigo_org_planta = p_planta
       AND ofr.orden_de_fabricacion = p_orden_de_fabricacion
       AND ofr.codigo_simulacion = p_simulacion;

    SELECT MAX(ofr.fase) --MAX (ofr.numero_secuencia_fabricacion)
      INTO v_ult_fase_gantt
      FROM sch_of_rutas ofr
     WHERE ofr.codigo_empresa = p_empresa
       AND ofr.codigo_org_planta = p_planta
       AND ofr.orden_de_fabricacion = p_orden_de_fabricacion
       AND ofr.numero_secuencia_fabricacion = p_secuencia
       AND ofr.codigo_simulacion = p_simulacion;

    v_fecha_inicio := p_fecha_inicio;

    IF v_ult_fase_of = v_ult_fase_gantt --SI SE HA MOVIDO LA ULTIMA FASE
       OR p_cambio_recurso -- O SE HA MOVIDO LA MAQUINA
     THEN
      -- MOVEMOS PROYECTO

      IF p_cambio_recurso THEN
        SELECT TO_CHAR(MIN(c.fecha_ini_fabri_prevista), 'DDMMYYYYHH24MISS')
          INTO v_fecha_inicio
          FROM sch_of_cab c
         WHERE c.codigo_empresa = p_empresa
           AND c.codigo_org_planta = p_planta
           AND c.orden_de_fabricacion = p_orden_de_fabricacion
           AND c.codigo_simulacion = p_simulacion;

      END IF;
      
      

      v_fecha_decalaje := (TO_DATE(LPAD(v_fecha_inicio, 14, '0'), 'DDMMYYYYHH24MISS'));
      pkpantallas.traza('v_fecha_inicio=' || v_fecha_inicio || ', v_fecha_decalaje=' || TO_CHAR(v_fecha_decalaje, 'DD/MM/YY HH24:MI:SS'), $$PLSQL_UNIT, 'UPDATE', 'DEBUG');

      pkpantallas.log('Andreu v_fecha_inicio: ' || v_fecha_inicio || ' v_fecha_decalaje: ' || v_fecha_decalaje || ' empresa: ' || p_empresa || ' planta: ' || p_simulacion || ' of: ' || p_orden_de_fabricacion);

      UPDATE sch_of_cab ofc
         SET fecha_ini_fabri_prevista = v_fecha_decalaje --TO_DATE('13/07/2013 17:12:00','DD/MM/YYYY HH24:MI:SS')
       WHERE ofc.codigo_empresa = p_empresa
         AND ofc.codigo_simulacion = p_simulacion
         AND ofc.codigo_org_planta = p_planta
         AND ofc.orden_de_fabricacion = p_orden_de_fabricacion;

      UPDATE sch_of_rutas ofc
         SET fijada = 'N'
       WHERE ofc.codigo_empresa = p_empresa
         AND ofc.codigo_simulacion = p_simulacion
         AND ofc.codigo_org_planta = p_planta
         AND ofc.orden_de_fabricacion = p_orden_de_fabricacion;

      SELECT MAX(duracion)
        INTO v_duracion_teorica_proyecto
        FROM (SELECT SUM(duracion_fase / 60 / (m.horas_turno * m.turnos)) duracion
                 FROM sch_actividades s, maquinas m
                WHERE s.codigo_empresa = p_empresa
                  AND s.codigo_simulacion = p_simulacion
                  AND s.codigo_org_planta = p_planta
                  AND m.codigo_empresa = s.codigo_empresa
                  AND m.codigo_org_planta = s.codigo_org_planta
                  AND m.codigo_maquina = s.maquina
                  AND (EXISTS (SELECT 1
                                 FROM sch_actividades sa
                                WHERE sa.codigo_empresa = s.codigo_empresa
                                  AND sa.codigo_org_planta = s.codigo_org_planta
                                  AND sa.codigo_simulacion = s.codigo_simulacion
                                  AND sa.num_of = s.num_of
                               CONNECT BY PRIOR sa.num_of = sa.num_of_padre
                                START WITH sa.num_of_padre = p_orden_de_fabricacion) OR s.num_of = p_orden_de_fabricacion)
                GROUP BY s.maquina);

      FOR r_proyecto IN c_proyecto LOOP
        UPDATE sch_of_cab ofc
           SET fecha_ini_fabri_prevista = v_fecha_decalaje
         WHERE ofc.codigo_empresa = p_empresa
           AND ofc.codigo_simulacion = p_simulacion
           AND ofc.codigo_org_planta = p_planta
           AND ofc.orden_de_fabricacion = r_proyecto.orden_de_fabricacion;

        UPDATE sch_of_rutas ofc
           SET fijada = 'N'
         WHERE ofc.codigo_empresa = p_empresa
           AND ofc.codigo_simulacion = p_simulacion
           AND ofc.codigo_org_planta = p_planta
           AND ofc.orden_de_fabricacion = r_proyecto.orden_de_fabricacion;
      END LOOP;

      SELECT *
        INTO r_calculo_cab
        FROM sch_calculo_cab
       WHERE codigo_empresa = p_empresa
         AND codigo_org_planta = p_planta
         AND codigo_simulacion = p_simulacion;

      SELECT op.factor_convs_horas
        INTO v_factor_horas
        FROM organizacion_plantas op
       WHERE op.codigo_empresa = p_empresa
         AND op.codigo_org_planta = p_planta;

      IF p_recalcular_al_mover THEN -- true
        v_error := pkprod_ccmaqs.scheduller(p_empresa, p_planta, p_simulacion, r_calculo_cab.planificar_a, r_calculo_cab.of_desde, r_calculo_cab.fecha_desde, r_calculo_cab.retenidas,
                                            r_calculo_cab.rep_con_cantidades, r_calculo_cab.fecha_arranque, r_calculo_cab.descripcion, r_calculo_cab.tipo_planificacion, r_calculo_cab.codigo_calendario,
                                            '1' /* ESCALA EN MINUTOS */, v_factor_horas, 90 /* HORIZONTE EN DIAS */, r_calculo_cab.hora_arranque, r_calculo_cab.opc_calculo_fases_ext, 'N',
                                            r_calculo_cab.solapamiento_fases);

        IF v_error THEN
          pkpantallas.log('ERROR:' || SQLERRM, $$PLSQL_UNIT, 'CALCULA_FECHA_FIN');
        ELSE
          UPDATE sch_of_rutas ofc
             SET fijada = 'S'
           WHERE ofc.codigo_empresa = p_empresa
             AND ofc.codigo_simulacion = p_simulacion
             AND ofc.codigo_org_planta = p_planta
             AND ofc.orden_de_fabricacion = p_orden_de_fabricacion;

          FOR r_proyecto IN c_proyecto LOOP
            UPDATE sch_of_rutas ofc
               SET fijada = 'S'
             WHERE ofc.codigo_empresa = p_empresa
               AND ofc.codigo_simulacion = p_simulacion
               AND ofc.codigo_org_planta = p_planta
               AND ofc.orden_de_fabricacion = r_proyecto.orden_de_fabricacion;
          END LOOP;

          SELECT MAX(id_sesion)
            INTO v_id_sesion
            FROM sch_grafico_recursos
           WHERE codigo_empresa = p_empresa
             AND codigo_org_planta = p_planta
             AND numero_simulacion = p_simulacion;

          -- procedemos a borrar las taulas utilizadas para la simulación
          DELETE FROM sch_grafico_recursos
           WHERE codigo_empresa = p_empresa
             AND codigo_org_planta = p_planta
             AND numero_simulacion = p_simulacion
             AND id_sesion = v_id_sesion;

          DELETE FROM sch_grafico_proyectos
           WHERE codigo_empresa = p_empresa
             AND codigo_org_planta = p_planta
             AND numero_simulacion = p_simulacion
             AND id_sesion = v_id_sesion;

          DELETE FROM sch_grafico_carga_recursos
           WHERE codigo_empresa = p_empresa
             AND codigo_org_planta = p_planta
             AND codigo_simulacion = p_simulacion
             AND id_sesion = v_id_sesion;

          DELETE FROM sch_recursos
           WHERE id_sesion = v_id_sesion;

          COMMIT;
          sch_carga_maquinas.prepara_grafico(p_simulacion, p_planta, p_empresa, p_hasta_proyecto, p_desde_proyecto, p_hasta_maquina, p_desde_maquina, p_hasta_of, p_desde_of, p_hasta_fecha,
                                             p_desde_fecha, v_id_sesion, p_desde_seccion, p_hasta_seccion, p_desde_tipo_maquina, p_hasta_tipo_maquina);
          sch_carga_maquinas.calcula_carga_maquinas(p_empresa, p_planta, p_simulacion, v_id_sesion);
          COMMIT;
        END IF;
      ELSE -- false
         pkpantallas.log('Andreu - Entra i actualitza');
        UPDATE sch_grafico_recursos
           SET fecha_fin =
               (fecha_fin - fecha_ini) + v_fecha_decalaje,
               fecha_ini = v_fecha_decalaje
         WHERE codigo_empresa = p_empresa
           AND codigo_org_planta = p_planta
           AND orden_de_fabricacion = p_orden_de_fabricacion
           AND nivel = 2
              --      AND secuencia = p_secuencia
           AND numero_simulacion = p_simulacion;

        UPDATE sch_grafico_proyectos
           SET fecha_fin =
               (fecha_fin - fecha_ini) + v_fecha_decalaje,
               fecha_ini = v_fecha_decalaje
         WHERE codigo_empresa = p_empresa
           AND codigo_org_planta = p_planta
           AND orden_de_fabricacion = p_orden_de_fabricacion
              --   AND secuencia = p_secuencia
           AND nivel = 2
           AND numero_simulacion = p_simulacion;

        UPDATE sch_grafico_recursos sgr2
           SET sgr2.fecha_ini =
               (SELECT MIN(sgr.fecha_ini)
                  FROM sch_grafico_proyectos sgr
                 WHERE sgr.nivel = 2
                   AND sgr.orden_de_fabricacion = p_orden_de_fabricacion),
               sgr2.fecha_fin =
               (SELECT MAX(sgr.fecha_fin)
                  FROM sch_grafico_proyectos sgr
                 WHERE sgr.nivel = 2
                   AND sgr.orden_de_fabricacion = p_orden_de_fabricacion)
         WHERE sgr2.nivel = 1
              --  AND SGR2.ID_SESION =  P_ID_SESION
           AND sgr2.codigo_empresa = p_empresa
           AND sgr2.codigo_org_planta = p_planta
           AND sgr2.numero_simulacion = p_simulacion
           AND sgr2.orden_de_fabricacion = p_orden_de_fabricacion;

        UPDATE sch_grafico_proyectos sgr2
           SET sgr2.fecha_ini =
               (SELECT MIN(sgr.fecha_ini)
                  FROM sch_grafico_proyectos sgr
                 WHERE sgr.nivel = 2
                   AND sgr.orden_de_fabricacion = p_orden_de_fabricacion),
               sgr2.fecha_fin =
               (SELECT MAX(sgr.fecha_fin)
                  FROM sch_grafico_proyectos sgr
                 WHERE sgr.nivel = 2
                   AND sgr.orden_de_fabricacion = p_orden_de_fabricacion)
         WHERE sgr2.nivel = 1
              --  AND SGR2.ID_SESION =  P_ID_SESION
           AND sgr2.codigo_empresa = p_empresa
           AND sgr2.codigo_org_planta = p_planta
           AND sgr2.numero_simulacion = p_simulacion
           AND sgr2.orden_de_fabricacion = p_orden_de_fabricacion;

      END IF;
   ELSE
      v_dummy_texto := sch_carga_maquinas.recoloca_actividad(p_empresa, p_planta, 'T', p_simulacion, p_orden_de_fabricacion, p_secuencia, v_fecha_inicio, p_mover_proyecto);
    END IF;

    IF p_mover_proyecto != '0' THEN
      DECLARE
        CURSOR c_patras IS
          SELECT *
            FROM sch_calculo
           WHERE codigo_empresa = p_empresa
             AND codigo_simulacion = p_simulacion
             AND num_of != 0
           ORDER BY tiempo_ini DESC
             FOR UPDATE;

        v_ini      FLOAT;
        v_prod     FLOAT;
        v_fin      FLOAT;
        v_of_padre NUMBER;
      BEGIN
        FOR r_patras IN c_patras LOOP
          BEGIN
            SELECT num_of_padre
              INTO v_of_padre
              FROM sch_actividades a
             WHERE a.codigo_empresa = p_empresa
               AND a.codigo_org_planta = p_planta
               AND a.codigo_simulacion = p_simulacion
               AND a.num_of = r_patras.num_of;

            IF NVL(v_of_padre, 0) != 0 THEN
              SELECT tiempo_ini, tiempo_prod, tiempo_fin
                INTO v_ini, v_prod, v_fin
                FROM sch_calculo c
               WHERE c.codigo_empresa = p_empresa
                 AND c.codigo_simulacion = p_simulacion
                 AND c.num_of = v_of_padre;

              UPDATE sch_calculo c
                 SET tiempo_fin = v_prod,
                     tiempo_prod = v_prod - (r_patras.tiempo_fin - r_patras.tiempo_prod),
                     tiempo_ini = v_prod - (r_patras.tiempo_fin - r_patras.tiempo_ini)
               WHERE CURRENT OF c_patras;
            END IF;
          EXCEPTION
            WHEN NO_DATA_FOUND THEN
              NULL;
            WHEN TOO_MANY_ROWS THEN
              NULL;
          END;
        END LOOP;
      END;
    END IF;

    COMMIT;
    RETURN ''; --v_texto;
  EXCEPTION
    WHEN OTHERS THEN
      pkpantallas.log(SQLERRM || ', p_empresa: ' || p_empresa || ', p_planta: ' || p_planta || ', p_simulacion: ' || p_simulacion || ', p_orden_de_fabricacion: ' || TO_CHAR(p_orden_de_fabricacion) ||
                      ', p_secuencia: ' || TO_CHAR(p_secuencia) || ', p_fecha_inicio: ' || p_fecha_inicio || ', p_cambio_recurso: ' || pkpantallas_aux.boolean2char(p_cambio_recurso) ||
                      ', p_desde_proyecto: ' || p_desde_proyecto || ', p_hasta_proyecto: ' || p_hasta_proyecto || ', p_desde_maquina: ' || p_desde_maquina || ', p_hasta_maquina: ' || p_hasta_maquina ||
                      ', p_desde_of: ' || p_desde_of || ', p_hasta_of: ' || p_hasta_of || ', p_desde_fecha_aux: ' || p_desde_fecha_aux || ', p_hasta_fecha_aux: ' || p_hasta_fecha_aux ||
                      ', p_desde_seccion: ' || p_desde_seccion || ', p_hasta_seccion: ' || p_hasta_seccion || ', p_desde_tipo_maquina: ' || p_desde_tipo_maquina || ', p_hasta_tipo_maquina: ' ||
                      p_hasta_tipo_maquina || ', p_recalcular_al_mover: ' || pkpantallas_aux.boolean2char(p_recalcular_al_mover), $$PLSQL_UNIT, 'CALCULA_FECHA_FIN');
      RAISE;
  END calcula_fecha_fin;

  FUNCTION recoloca_actividad(p_codigo_empresa VARCHAR2, p_planta VARCHAR2, p_planificacion VARCHAR2, p_codigo_simulacion VARCHAR2, p_num_of NUMBER, p_secuencia NUMBER, p_fini VARCHAR2,
                              p_mover_proyecto NUMBER) RETURN VARCHAR IS
    v_fini                VARCHAR2(21);
    v_hay                 NUMBER(18);
    v_id_inicio_horizonte NUMBER(10);
    v_fin_fase_pre        NUMBER(10) := 0;
    v_ini_prod_pre        NUMBER(10) := 0;
    v_fin_fase            NUMBER(10) := 0;
    v_unidades_tiempo     NUMBER(10) := 0;
    v_inicio_fase         NUMBER(10) := 0;
    v_inicio_prod         NUMBER(10) := 0;
    v_colocator           BOOLEAN;
    v_pausa_ini           NUMBER(7);
    v_pausa_fin           NUMBER(7);
    v_total_pausa         NUMBER(13);
    v_ok                  BOOLEAN := FALSE;
    v_next_ini            NUMBER(10);
    v_prev_fin            NUMBER(10);
    v_r_actividades       sch_actividades%ROWTYPE;
    v_mensaje             VARCHAR2(1024);
    v_planificacion       VARCHAR2(1);
    v_factor_conv_horas   organizacion_plantas.factor_convs_horas%TYPE;

    PROCEDURE asigna_maquinas(p_codigo_simulacion VARCHAR2, p_codigo_empresa VARCHAR2) IS
      -- DPF 12/12/2008 LE AÑADO A LA WHERE LOS DATOS DE LA EMPRESA Y LA SIMULACION
      CURSOR c_calculo(rec VARCHAR2, inicio NUMBER, p_simu VARCHAR2, p_emp VARCHAR2) IS
        SELECT *
          FROM sch_calculo
         WHERE tiempo_fin > inicio
           AND recurso = rec
           AND estado = 'O'
           AND codigo_simulacion = p_simu
           AND codigo_empresa = p_emp
         ORDER BY tiempo_ini;

      r_calculo c_calculo%ROWTYPE;
    BEGIN
      OPEN c_calculo(v_r_actividades.maquina, v_inicio_fase, p_codigo_simulacion, p_codigo_empresa);

      LOOP
        --
        -- BUSCA EL SIGUIENTE REGISTRO OCUPADO DE LA MAQUINA A PARTIR DE LA FECHA PREVISTA DE INICIO
        -- PARA VER SI SE PUEDE COLOCAR LA ACTIVIDAD ACTUAL.
        --
        FETCH c_calculo
          INTO r_calculo;

        EXIT WHEN c_calculo%NOTFOUND;
        v_colocator := TRUE;

        --
        -- COMPRUEBA SI EL INICIO PREVISTO ESTA OCUPADO POR EL REGISTRO ENCONTRADO
        -- ES ESTE CASO SE REASIGNA EL TIEMPO DE INICIO PREVISTO AL FIN DE ESA PRODUCCIÓN ENCONTRADA
        -- Y SE BUSCA EL SIGUIENTE HUECO. SI NO SE ENCONTRARA NINGUNO LA DURACION DE LA FASE SERIA DESDE
        -- ESE INSTANTE HASTA LO QUE DURE
        --
        IF r_calculo.tiempo_ini <= v_inicio_fase THEN
          v_inicio_fase := r_calculo.tiempo_fin;
          v_inicio_prod := v_inicio_fase + v_r_actividades.tiempo_prep_maqui;
          v_fin_fase := (v_inicio_prod + v_unidades_tiempo);
        ELSE
          --
          -- SI NO ESTA OCUPADO SE COMPRUEBA SI LA ACTIVIDAD CABE EN ESE HUECO LIBRE
          --
          IF r_calculo.tiempo_ini > (v_inicio_fase + v_unidades_tiempo) THEN
            v_fin_fase := (v_inicio_prod + v_unidades_tiempo);
            EXIT;
          END IF;
        END IF;
      END LOOP;

      CLOSE c_calculo;
    END;
  BEGIN
    IF pkpantallas.get_activada_traza() THEN
      pkpantallas.traza('p_codigo_empresa: ' || p_codigo_empresa || ', p_planta: ' || p_planta || ', p_planificacion: ' || p_planificacion || ', p_codigo_simulacion: ' || p_codigo_simulacion ||
                        ', p_num_of: ' || TO_CHAR(p_num_of) || ', p_secuencia: ' || TO_CHAR(p_secuencia) || ', p_fini: ' || p_fini || ', p_mover_proyecto: ' || TO_CHAR(p_mover_proyecto), $$PLSQL_UNIT,
                        'RECOLOCA_ACTIVIDAD', 'DEBUG');
    END IF;

    -- SI LA FECHA INICIO NO TIENE SUFICIENTES CARACTERES LE AÑADIMOS UN 0 DELANTE DEL DIA
    IF LENGTH(p_fini) = 13 THEN
      v_fini := '0' || p_fini;
    ELSE
      v_fini := p_fini;
    END IF;

    SELECT p.factor_convs_horas
      INTO v_factor_conv_horas
      FROM organizacion_plantas p
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_planta;

    -- BUSCAMOS EL INICIO DEL HORIZONTE
    SELECT c.inicio_horizonte, tipo_planificacion
      INTO v_id_inicio_horizonte, v_planificacion
      FROM sch_calculo_cab c
     WHERE codigo_simulacion = p_codigo_simulacion
       AND codigo_empresa = p_codigo_empresa;

    -- RECUPERAMOS LA INFORMACION DE LA ACTIVIDAD
    SELECT *
      INTO v_r_actividades
      FROM sch_actividades
     WHERE num_of = p_num_of
       AND secuencia = p_secuencia
       AND codigo_empresa = p_codigo_empresa
       AND codigo_simulacion = p_codigo_simulacion
       AND codigo_org_planta = p_planta;

    --v_inicio_prod := (TO_CHAR(TO_DATE(v_fini, 'DD/MM/YYYY HH24:MI:SS'), 'j') - v_id_inicio_horizonte + (TO_DATE(v_fini, 'DD/MM/YYYY HH24:MI:SS') - TRUNC(TO_DATE(v_fini, 'DD/MM/YYYY HH24:MI:SS')))) * 1440;
    v_inicio_prod := (TO_CHAR(TO_DATE(v_fini, 'ddmmyyyyhh24miss'), 'j') - v_id_inicio_horizonte + (TO_DATE(v_fini, 'ddmmyyyyhh24miss') - TRUNC(TO_DATE(v_fini, 'ddmmyyyyhh24miss')))) * 1440;
    v_inicio_fase := v_inicio_prod;
    v_unidades_tiempo := v_r_actividades.duracion_fase + NVL(v_r_actividades.tiempo_prep_maqui, 0);

    -- comprobar si se ha puesto antes de alguna actividad precedente
    --

    -- COMPROBANDO SI LA ACTIVIDAD SE ADELANTA A SU SUCESORA
    SELECT MAX(tiempo_fin) -- OJO DEBE SER TIEMPO_INI !!!!
      INTO v_prev_fin
      FROM sch_calculo
     WHERE num_of = p_num_of
       AND secuencia < v_r_actividades.secuencia
       AND codigo_simulacion = p_codigo_simulacion
       AND codigo_empresa = p_codigo_empresa;

    IF v_prev_fin IS NULL THEN
      BEGIN
        IF p_mover_proyecto = '0' THEN
          SELECT MAX(tiempo_fin)
            INTO v_prev_fin
            FROM sch_calculo c
           WHERE EXISTS (SELECT num_of
                    FROM sch_actividades a
                   WHERE a.num_of_padre = p_num_of
                     AND a.num_of = c.num_of
                     AND a.codigo_empresa = c.codigo_empresa
                     AND a.codigo_simulacion = c.codigo_simulacion
                     AND a.codigo_org_planta = p_planta)
             AND codigo_simulacion = p_codigo_simulacion
             AND codigo_empresa = p_codigo_empresa;
        ELSE
          v_prev_fin := 0;
        END IF;

        IF v_prev_fin > v_inicio_prod THEN
          v_mensaje := 'Imposible colocar en esta fecha porque se solapa con la actividad anterior';

          -- NO SE PUEDE COLOCAR EN ESTA FECHA PORQUE SOLAPA ACTIVIDAD ANTERIOR
          -- LO DEJAMOS COMO ESTABA
          SELECT tiempo_fin
            INTO v_fin_fase
            FROM sch_calculo
           WHERE num_of = p_num_of
             AND secuencia = p_secuencia
             AND codigo_simulacion = p_codigo_simulacion
             AND codigo_empresa = p_codigo_empresa;

          v_ok := TRUE;
          RETURN(v_fin_fase / 1440) - floor(v_fin_fase / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_fin_fase / 1440), 'J');
        ELSE
          -- NO SOLAPA CON ANTERIOR, SE CALCULA
          v_ok := FALSE;
        END IF;
      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          NULL;
      END;
    ELSE
      IF v_prev_fin > (TO_CHAR(TO_DATE(v_fini, 'ddmmyyyyhh24miss'), 'j') - v_id_inicio_horizonte) * 1440 THEN
        --  V_FINI := v_prev_fin;
        v_inicio_prod := v_prev_fin;
        v_inicio_fase := v_inicio_prod;
        v_unidades_tiempo := v_r_actividades.duracion_fase + NVL(v_r_actividades.tiempo_prep_maqui, 0);
      END IF;
    END IF;

    DELETE FROM sch_calculo
     WHERE num_of = p_num_of
       AND secuencia = p_secuencia
       AND codigo_empresa = p_codigo_empresa
       AND codigo_simulacion = p_codigo_simulacion;

    LOOP
      EXIT WHEN v_ok; -- OK CUANDO LAS PAUSAS ESTEN CALCULADAS
      --
      -- MOTOR DE BUSQUEDA DE TIEMPOS LIBRES EN LA MÁQUINA
      --
      v_colocator := FALSE;

      --
      -- SI PLANIFICACION FINITA SE CONSIDERA LA DISPONIBILIDAD DE LAS MÁQUINAS
      --
      IF v_planificacion = 'F' THEN
        asigna_maquinas(p_codigo_simulacion, p_codigo_empresa);
      END IF;

      --
      -- SI NO SE HA ENCONTRADO NINGUN REGISTRO DE OCUPACION DE LA MAQUINA SE COLOCA EL FIN DE LA ACTIVIDAD
      --
      IF NOT v_colocator THEN
        v_fin_fase := (v_inicio_prod + v_unidades_tiempo);
      END IF;

      --
      -- CALCULO DE PAUSAS
      --
      BEGIN
        --
        -- BUSCA SI EL INICIO DE LA FASE COINCIDE CON ALGUNA PAUSA
        --
        SELECT sch.tiempo_ini, sch.tiempo_fin
          INTO v_pausa_ini, v_pausa_fin
          FROM sch_calculo sch
         WHERE codigo_empresa = p_codigo_empresa
           AND codigo_simulacion = p_codigo_simulacion
           AND sch.recurso = v_r_actividades.maquina
           AND sch.estado = 'P'
           AND v_inicio_fase >= sch.tiempo_ini -- =>
           AND v_inicio_fase < sch.tiempo_fin; -- <=

        --0
        v_inicio_prod := v_pausa_fin + (v_inicio_prod - v_inicio_fase);
        -- -> + 1;
        v_inicio_fase := v_pausa_fin; -- -> + 1;
        -- INICIO_FASE := PAUSA_FIN + 1;
        v_mensaje := 'Se han aplicado pausas';
        v_ok := FALSE;
      EXCEPTION
        WHEN NO_DATA_FOUND OR TOO_MANY_ROWS THEN
          v_ok := TRUE; -- NO HAY PAUSA EN INICIO FASE
      END;

      IF v_ok THEN
        --
        -- TIEMPO PAUSA DURANTE PREPARACION
        --
        SELECT NVL(SUM(tiempo_fin - tiempo_ini), 0)
          INTO v_total_pausa
          FROM sch_calculo
         WHERE recurso = v_r_actividades.maquina
           AND estado = 'P'
           AND tiempo_ini >= v_inicio_fase
           AND tiempo_ini < v_inicio_prod;

        --       AND TIEMPO_INI BETWEEN INICIO_FASE AND INICIO_PROD;
        --0
        v_ini_prod_pre := v_inicio_prod;
        v_fin_fase_pre := v_fin_fase;
        v_inicio_prod := v_inicio_prod + v_total_pausa;
        v_fin_fase := v_fin_fase + v_total_pausa;

        --
        -- SE COMPRUEBA SI CON EL TIEMPO AÑADIDO POR PAUSA HAY MAS PAUSAS Y SE AÑADEN
        --
        LOOP
          BEGIN
            SELECT NVL(SUM(tiempo_fin - tiempo_ini), 0)
              INTO v_total_pausa
              FROM sch_calculo
             WHERE recurso = v_r_actividades.maquina
               AND estado = 'P'
               AND tiempo_ini >= v_ini_prod_pre
               AND tiempo_ini < v_inicio_prod;

            --     WHERE TIEMPO_INI BETWEEN INI_PROD_PRE AND INICIO_PROD;
            IF v_total_pausa = 0 THEN
              EXIT;
            END IF;

            v_ini_prod_pre := v_inicio_prod;
            v_fin_fase_pre := v_fin_fase;
            v_inicio_prod := v_inicio_prod + v_total_pausa;
            v_fin_fase := v_fin_fase + v_total_pausa;
            v_mensaje := 'Se han aplicado pausas';
          END;
        END LOOP;

        IF v_planificacion = 'F' THEN
          --
          -- VERIFICACION DE QUE NO SOLAPA NINGUNA FASE LA QUE ACABAMOS DE RECALCULAR
          --
          SELECT MAX(tiempo_fin)
            INTO v_hay
            FROM sch_calculo
           WHERE recurso = v_r_actividades.maquina
             AND estado = 'O'
             AND tiempo_ini >= v_inicio_fase
             AND tiempo_ini < v_inicio_prod
             AND tiempo_ini <> tiempo_fin;

          --       AND TIEMPO_INI BETWEEN INICIO_FASE AND INICIO_PROD;
          --1
          IF NVL(v_hay, 0) > 0 THEN
            v_ok := FALSE; -- LA FASE SE SOLAPA CON OTRA FASE
            v_inicio_fase := v_hay;
            v_inicio_prod := v_inicio_fase + v_r_actividades.tiempo_prep_maqui;
            v_fin_fase := v_inicio_prod + v_unidades_tiempo;
            v_mensaje := v_mensaje || '. La operación se solapa con la O.F. ' || TO_CHAR(v_r_actividades.num_of) || ' en recurso ' || v_r_actividades.maquina;
          ELSE
            v_ok := TRUE; -- LA FASE NO SE SOLAPA CON OTRA FASE
          END IF;
        ELSE
          v_ok := TRUE; -- LA FASE NO SE SOLAPA CON OTRA FASE
        END IF;
      END IF;

      v_total_pausa := 0;

      IF v_ok THEN
        --
        -- TIEMPO DE PAUSA DURANTE LA PRODUCCION
        --
        SELECT NVL(SUM(tiempo_fin - tiempo_ini), 0)
          INTO v_total_pausa
          FROM sch_calculo
         WHERE recurso = v_r_actividades.maquina
           AND estado = 'P'
           AND tiempo_ini >= v_inicio_prod
           AND tiempo_ini < v_fin_fase;

        --       AND TIEMPO_INI BETWEEN INICIO_PROD AND FIN_FASE;
        v_fin_fase_pre := v_fin_fase;
        v_fin_fase := v_fin_fase + v_total_pausa;

        --
        -- SE COMPRUEBA SI CON EL TIEMPO AÑADIDO POR PAUSA HAY MAS PAUSAS Y SE AÑADEN
        --
        LOOP
          SELECT NVL(SUM(tiempo_fin - tiempo_ini), 0)
            INTO v_total_pausa
            FROM sch_calculo
           WHERE recurso = v_r_actividades.maquina
             AND estado = 'P'
             AND tiempo_ini >= v_fin_fase_pre
             AND tiempo_ini < v_fin_fase
             AND codigo_empresa = p_codigo_empresa
             AND codigo_simulacion = p_codigo_simulacion;

          -- v_total_pausa := 0; -- OJO!!!!    QUITAR SOLO PRUEBAS
          --     WHERE TIEMPO_INI BETWEEN FIN_FASE_PRE AND FIN_FASE;
          IF v_total_pausa = 0 THEN
            EXIT;
          END IF;

          v_fin_fase_pre := v_fin_fase;
          v_fin_fase := v_fin_fase + v_total_pausa;
          v_mensaje := v_mensaje || ' Se han añadido pausas.';
        END LOOP;

        --
        -- VERIFICACION DE QUE NO SOLAPA NINGUNA FASE LA QUE ACABAMOS DE RECALCULAR
        --
        BEGIN
          IF v_planificacion = 'F' THEN
            SELECT MAX(tiempo_fin)
              INTO v_hay
              FROM sch_calculo
             WHERE recurso = v_r_actividades.maquina
               AND estado = 'O'
               AND tiempo_ini >= v_inicio_fase
               AND tiempo_ini < v_fin_fase
               AND codigo_empresa = p_codigo_empresa
               AND codigo_simulacion = p_codigo_simulacion;
          ELSE
            v_hay := 0;
          END IF;

          --       AND TIEMPO_INI BETWEEN INICIO_FASE AND FIN_FASE;
          IF v_hay > 0 THEN
            v_ok := FALSE; -- LA FASE SE SOLAPA CON OTRA FASE

            IF v_hay = v_inicio_fase THEN
              v_inicio_fase := v_hay + 1;
              -- CASO EN QUE SE SOLAPE CON UNA FASE DE DURACION 0 (INICIA Y ACABA EN EL MISMO MINUTO)
            ELSE
              v_inicio_fase := v_hay;
            END IF;

            v_inicio_prod := v_inicio_fase + v_r_actividades.tiempo_prep_maqui;
            v_fin_fase := v_inicio_prod + v_unidades_tiempo;
          ELSE
            v_ok := TRUE; -- LA FASE NO SE SOLAPA CON OTRA FASE
          END IF;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            v_ok := TRUE; -- LA FASE NO SE SOLAPA CON OTRA FASE
        END;
      END IF;
    END LOOP;

    IF v_ok = TRUE THEN
      -- COMPROBANDO SILA ACTIVIDAD SE ADELANTA A SU SUCESORA
      SELECT MIN(tiempo_prod) -- OJO DEBE SER TIEMPO_INI !!!!
        INTO v_next_ini
        FROM sch_calculo
       WHERE num_of = p_num_of
         AND secuencia > v_r_actividades.secuencia
         AND codigo_simulacion = p_codigo_simulacion
         AND codigo_empresa = p_codigo_empresa;

      IF v_next_ini IS NULL THEN
        SELECT MIN(tiempo_prod) -- OJO DEBE SER TIEMPO_INI !!!!
          INTO v_next_ini
          FROM sch_calculo
         WHERE num_of = v_r_actividades.num_of_padre
           AND codigo_simulacion = p_codigo_simulacion
           AND codigo_empresa = p_codigo_empresa;
      END IF;
     pkpantallas.log('Andreu 2');
      IF v_next_ini IS NOT NULL AND v_next_ini < v_fin_fase THEN
        pkpantallas.log('Andreu 3');
         pkpantallas.log('p_num_of ' || p_num_of || ' ' || p_secuencia || ' ' ||  p_codigo_simulacion || ' ' || p_codigo_empresa);
        -- LO DEJAMOS COMO ESTABA
      SELECT tiempo_fin
          INTO v_fin_fase
          FROM sch_calculo
         WHERE num_of =   p_num_of
           AND secuencia =  p_secuencia
           AND codigo_simulacion = p_codigo_simulacion
           AND codigo_empresa =  p_codigo_empresa;

        v_mensaje := v_mensaje || 'No se asignar la actividad a esa fecha porque solapa a la O.F. ' || TO_CHAR(v_r_actividades.num_of_padre);
      
      ELSE
        -- RECOLOCAMOS LA ACTIVIDAD

        -- BORRAMOS LA ACTIVIDAD ACTUAL
      
      DELETE sch_calculo
         WHERE num_of = p_num_of
           AND secuencia = p_secuencia
           AND codigo_simulacion = p_codigo_simulacion
           AND codigo_empresa = p_codigo_empresa;

        INSERT INTO sch_calculo
          (tiempo_ini, tiempo_prod, tiempo_fin, recurso, num_of, fase, secuencia, estado, codigo_simulacion, codigo_empresa)
        VALUES
          (v_inicio_prod, v_inicio_prod, v_fin_fase, v_r_actividades.maquina, p_num_of, v_r_actividades.fase, v_r_actividades.secuencia, 'O', p_codigo_simulacion, p_codigo_empresa);
        
        UPDATE sch_of_rutas
           SET fecha_ini_prevista =
               (v_inicio_prod / 1440) - floor(v_inicio_prod / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_inicio_prod / 1440), 'J'),
               fecha_fin_prevista =
               (v_fin_fase / 1440) - floor(v_fin_fase / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_fin_fase / 1440), 'J'),
               fecha_fin_prevista_prep =
               (v_inicio_prod / 1440) - floor(v_inicio_prod / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_inicio_prod / 1440), 'J')
         WHERE codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_planta
           AND orden_de_fabricacion = p_num_of
           AND numero_secuencia_fabricacion = v_r_actividades.secuencia
           AND codigo_simulacion = p_codigo_simulacion;

        -- hacemos un update de las tablas de los gráficos
        UPDATE sch_grafico_recursos
           SET fecha_ini =
               (v_inicio_prod / 1440) - floor(v_inicio_prod / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_inicio_prod / 1440), 'J'),
               fecha_fin =
               (v_fin_fase / 1440) - floor(v_fin_fase / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_fin_fase / 1440), 'J')
         WHERE codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_planta
           AND orden_de_fabricacion = p_num_of
           AND secuencia = v_r_actividades.secuencia
           AND numero_simulacion = p_codigo_simulacion;

        UPDATE sch_grafico_proyectos
           SET fecha_ini =
               (v_inicio_prod / 1440) - floor(v_inicio_prod / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_inicio_prod / 1440), 'J'),
               fecha_fin =
               (v_fin_fase / 1440) - floor(v_fin_fase / 1440) + TO_DATE(v_id_inicio_horizonte + floor(v_fin_fase / 1440), 'J')
         WHERE codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_planta
           AND orden_de_fabricacion = p_num_of
           AND secuencia = v_r_actividades.secuencia
           AND numero_simulacion = p_codigo_simulacion;
      END IF;
    END IF;

    RETURN v_mensaje;
  EXCEPTION
    WHEN OTHERS THEN
      pkpantallas.log(SQLERRM || ', p_codigo_empresa: ' || p_codigo_empresa || ', p_planta: ' || p_planta || ', p_planificacion: ' || p_planificacion || ', p_codigo_simulacion: ' ||
                      p_codigo_simulacion || ', p_num_of: ' || TO_CHAR(p_num_of) || ', p_secuencia: ' || TO_CHAR(p_secuencia) || ', p_fini: ' || p_fini || ', p_mover_proyecto: ' ||
                      TO_CHAR(p_mover_proyecto), $$PLSQL_UNIT, 'RECOLOCA_ACTIVIDAD');
      RAISE;
  END recoloca_actividad;

  PROCEDURE cambio_fecha_pedidos(p_empresa VARCHAR2) IS
    CURSOR c_ordenes_fabrica_rutas IS
      SELECT *
        FROM ordenes_fabrica_rutas
       WHERE codigo_empresa = p_empresa
         AND maq_asignada_en_calculo = 'S'
            -- FALTA LA PLANTA !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
         AND situacion_ruta = 'A';

    CURSOR c_solicitudes(numero_orden NUMBER, estudio NUMBER) IS
      SELECT LEVEL nivel, pn.*, '02' || rownum num
        FROM planificacion_necesidades pn
      CONNECT BY PRIOR pn.n_registro = pn.n_registro_padre
             AND pn.codigo_empresa = p_empresa
             AND pn.numero_estudio = estudio
             AND pn.numero_of IS NULL
             AND EXISTS (SELECT 1
                    FROM asignacion_ped_compras apc
                   WHERE apc.codigo_empresa = pn.codigo_empresa
                     AND apc.organizacion_compras = pn.organizacion_compras
                     AND apc.numero_solicitud = pn.numero_solicitud
                     AND apc.numero_linea = pn.numero_solicitud_lin)
       START WITH pn.numero_of = numero_orden;

    v_estudio                  NUMBER;
    var_nueva_fecha            DATE;
    v_ciclo_compra             NUMBER;
    v_codigo_calendario        VARCHAR2(10);
    v_tipo_periodo_fabricacion organizacion_plantas.tipo_periodo_fabricacion%TYPE;
    v_ejercicio                NUMBER;
    v_periodo                  NUMBER;
    v_correcto                 BOOLEAN;
    v_pedido                   asignacion_ped_compras.numero_pedido%TYPE;
    v_organizacion_compras     asignacion_ped_compras.organizacion_compras%TYPE;
    v_numero_linea             asignacion_ped_compras.numero_linea%TYPE;
    v_numero_serie             asignacion_ped_compras.serie_numeracion%TYPE;
    var_proveedor              VARCHAR2(15);
    var_fecha_entrega          DATE;
  BEGIN
    -- RECORRO EL CURSOR DE LAS OFS QUE ESTAN ASIGNADAS EN EL CALCULO DE MAQUINAS
    FOR ordenes IN c_ordenes_fabrica_rutas LOOP
      BEGIN
        -- BUSCO EL NUMERO DE ESTUDIO AL QUE PERTENECE LA OF ACTUAL
        SELECT numero_estudio
          INTO v_estudio
          FROM planificacion_necesidades
         WHERE codigo_empresa = ordenes.codigo_empresa
           AND codigo_articulo = ordenes.codigo_articulo
           AND numero_of = ordenes.orden_de_fabricacion
           AND codigo_presentacion = ordenes.codigo_presentacion;
      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          NULL;
      END;

      -- NOS RECORREMOS TODAS LAS SOLICITUDES QUE TIENEN PEDIDOS QUE DEPENDEN 'DIRECTAMENTE' DE LA OF ACTUAL
      FOR x IN c_solicitudes(ordenes.orden_de_fabricacion, v_estudio) LOOP
        IF x.nivel > 1 THEN
          -- BUSCAMOS EL CICLO DE COMPRA DEL ARTICULO DEL PEDIDO
          SELECT ciclo_compra
            INTO v_ciclo_compra
            FROM articulos
           WHERE codigo_empresa = x.codigo_empresa
             AND codigo_articulo = x.codigo_articulo;

          -- RESTAMOS EL CICLO DE COMPRA DEL ARTICULO A LA FECHA DE ENTREGA DE LA OF ACTUAL PARA OBTENER LA NUEVA DE ENTREGA DEL PEDIDO
          var_nueva_fecha := ordenes.fecha_ini_prevista - NVL(v_ciclo_compra, 0);

          -- SELECCIONAMOS EL CALENDARIO DE LA PLANTA ACTUAL
          SELECT codigo_calendario, tipo_periodo_fabricacion
            INTO v_codigo_calendario, v_tipo_periodo_fabricacion
            FROM organizacion_plantas
           WHERE codigo_empresa = p_empresa
             AND codigo_org_planta = x.codigo_org_planta;

          -- LLAMAMOS A LA FUNCIÓN PARA CAMBIAR LA FECHA SI ES FESTIVA
          v_correcto := cambio_fecha_si_es_festiva(p_empresa, x.codigo_org_planta, v_tipo_periodo_fabricacion, v_codigo_calendario, var_nueva_fecha, v_ejercicio, v_periodo);

          IF v_correcto = FALSE THEN
            RETURN;
          END IF;

          -- BUSCO LOS VALORES DE LA PK DEL PEDIDO (MIRO A QUE PEDIDO CORRESPONDE LA SOLICITUD ACTUAL)
          SELECT numero_pedido, serie_numeracion, numero_linea, organizacion_compras
            INTO v_pedido, v_numero_serie, v_numero_linea, v_organizacion_compras
            FROM asignacion_ped_compras
           WHERE codigo_empresa = x.codigo_empresa
             AND organizacion_compras = x.organizacion_compras
             AND numero_solicitud = x.numero_solicitud
             AND numero_linea = x.numero_solicitud_lin;

          -- BUSCO EL PROVEEDOR AL QUE PERTENECE EL PEDIDO DE COMPRAS
          SELECT codigo_proveedor, fecha_entrega
            INTO var_proveedor, var_fecha_entrega
            FROM pedidos_compras
           WHERE codigo_empresa = p_empresa
             AND organizacion_compras = v_organizacion_compras
             AND serie_numeracion = v_numero_serie
             AND numero_pedido = v_pedido;

          -- SI LAS FECHAS NO COINCIDEN (SE DEBE MODIFICAR) INSERTAMOS LA INFORMACIÓN EN LA TABLA
          IF TO_CHAR(var_fecha_entrega, 'DD/MM/YYYY') != TO_CHAR(var_nueva_fecha, 'DD/MM/YYYY') THEN
            -- INSERTAMOS EN LA TABLA P_PROPUESTAS_CAMBIOS_PEDCOM LOS VALORES DE LA NUEVA FECHA
            INSERT INTO p_propuestas_cambios_pedcom
              (codigo_empresa, organizacion_compras, serie_numeracion, numero_pedido, numero_linea, codigo_articulo, descripcion, referencia_proveedor, descrip_refer_proveedor, fecha_entrega,
               fecha_entrega_modificada, codigo_proveedor, modificacion)
              SELECT codigo_empresa, organizacion_compras, serie_numeracion, numero_pedido, numero_linea, codigo_articulo, descripcion, referencia_proveedor, descrip_proveedor_1, fecha_entrega,
                     var_nueva_fecha, var_proveedor, 'MODIFICAR FECHA PEDIDO'
                FROM pedidos_compras_lin
               WHERE codigo_empresa = p_empresa
                 AND organizacion_compras = v_organizacion_compras
                 AND serie_numeracion = v_numero_serie
                 AND numero_pedido = v_pedido
                 AND numero_linea = v_numero_linea;

            UPDATE pedidos_compras
               SET emitido = '0000'
             WHERE codigo_empresa = p_empresa
               AND organizacion_compras = v_organizacion_compras
               AND serie_numeracion = v_numero_serie
               AND numero_pedido = v_pedido;
          END IF;
        END IF;
      END LOOP;
    END LOOP;

    COMMIT;
  END;

  PROCEDURE cambio_fecha_solicitudes(p_empresa VARCHAR2) IS
    CURSOR c_ordenes_fabrica_rutas IS
      SELECT *
        FROM ordenes_fabrica_rutas
       WHERE codigo_empresa = p_empresa
         AND maq_asignada_en_calculo = 'S'
         AND situacion_ruta = 'A';

    CURSOR c_solicitudes(numero_orden NUMBER, estudio NUMBER) IS
      SELECT LEVEL nivel, pn.*, '02' || rownum num
        FROM planificacion_necesidades pn
      CONNECT BY PRIOR pn.n_registro = pn.n_registro_padre
             AND pn.codigo_empresa = p_empresa
             AND pn.numero_estudio = estudio
             AND pn.numero_of IS NULL
             AND NOT EXISTS (SELECT 1
                    FROM asignacion_ped_compras apc
                   WHERE apc.codigo_empresa = pn.codigo_empresa
                     AND apc.organizacion_compras = pn.organizacion_compras
                     AND apc.numero_solicitud = pn.numero_solicitud
                     AND apc.numero_linea = pn.numero_solicitud_lin)
       START WITH pn.numero_of = numero_orden;

    v_estudio                  NUMBER;
    var_nueva_fecha            DATE;
    v_ciclo_compra             NUMBER;
    v_codigo_calendario        VARCHAR2(10);
    v_tipo_periodo_fabricacion organizacion_plantas.tipo_periodo_fabricacion%TYPE;
    v_ejercicio                NUMBER;
    v_periodo                  NUMBER;
    v_correcto                 BOOLEAN;
  BEGIN
    -- RECORRO EL CURSOR DE LAS OFS QUE ESTAN ASIGNADAS EN EL CALCULO DE MAQUINAS
    FOR ordenes IN c_ordenes_fabrica_rutas LOOP
      BEGIN
        -- BUSCO EL NUMERO DE ESTUDIO AL QUE PERTENECE LA OF ACTUAL
        SELECT numero_estudio
          INTO v_estudio
          FROM planificacion_necesidades
         WHERE codigo_empresa = ordenes.codigo_empresa
           AND codigo_articulo = ordenes.codigo_articulo
           AND numero_of = ordenes.orden_de_fabricacion
           AND codigo_presentacion = ordenes.codigo_presentacion;
      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          NULL;
      END;

      -- NOS RECORREMOS TODAS LAS SOLICITUDES QUE DEPENDEN 'DIRECTAMENTE' DE LA OF ACTUAL
      FOR x IN c_solicitudes(ordenes.orden_de_fabricacion, v_estudio) LOOP
        IF x.nivel > 1 THEN
          -- BUSCAMOS EL CICLO DE COMPRA DEL ARTICULO DE LA SOLICITUD
          BEGIN
            SELECT ciclo_compra
              INTO v_ciclo_compra
              FROM articulos
             WHERE codigo_empresa = x.codigo_empresa
               AND codigo_articulo = x.codigo_articulo;
          EXCEPTION
            WHEN NO_DATA_FOUND THEN
              pkpantallas.log(x.codigo_articulo, $$PLSQL_UNIT, 'CAMBIO_FECHA_SOLICITUDES');
          END;

          -- RESTAMOS EL CICLO DE COMPRA DEL ARTICULO A LA FECHA DE ENTREGA DE LA OF ACTUAL PARA OBTENER LA NUEVA FECHA_NECESIDAD DE LA SOLICITUD
          var_nueva_fecha := ordenes.fecha_ini_prevista - NVL(v_ciclo_compra, 0);

          -- SELECCIONAMOS EL CALENDARIO DE LA PLANTA ACTUAL
          SELECT codigo_calendario, tipo_periodo_fabricacion
            INTO v_codigo_calendario, v_tipo_periodo_fabricacion
            FROM organizacion_plantas
           WHERE codigo_empresa = p_empresa
             AND codigo_org_planta = x.codigo_org_planta;

          -- LLAMAMOS A LA FUNCIÓN PARA CAMBIAR LA FECHA SI ES FESTIVA
          v_correcto := cambio_fecha_si_es_festiva(p_empresa, x.codigo_org_planta, v_tipo_periodo_fabricacion, v_codigo_calendario, var_nueva_fecha, v_ejercicio, v_periodo);

          IF v_correcto = FALSE THEN
            RETURN;
          END IF;

          -- ASIGNAMOS LA NUEVA FECHA DE NECESIDAD A LA SOLICITUD
          UPDATE solicitud_materiales_lin
             SET fecha_necesidad = var_nueva_fecha
           WHERE codigo_empresa = x.codigo_empresa
             AND organizacion_compras = x.organizacion_compras
             AND numero_solicitud = x.numero_solicitud
             AND linea_solicitud = x.numero_solicitud_lin;
        END IF;
      END LOOP;
    END LOOP;

    COMMIT;
  END;

  PROCEDURE actualiza_porc_completado(p_codigo_simulacion VARCHAR2, p_id_sesion NUMBER) IS
  BEGIN
    UPDATE sch_of_rutas sor
       SET sor.cantidad_aceptada =
           (SELECT ofr.cantidad_aceptada
              FROM ordenes_fabrica_rutas ofr
             WHERE ofr.codigo_empresa = sor.codigo_empresa
               AND ofr.codigo_org_planta = sor.codigo_org_planta
               AND ofr.orden_de_fabricacion = sor.orden_de_fabricacion
               AND ofr.fase = sor.fase
               AND ofr.numero_secuencia_fabricacion = sor.numero_secuencia_fabricacion
               AND ofr.tipo_fase = 'P')
     WHERE codigo_simulacion = p_codigo_simulacion;

    UPDATE sch_grafico_recursos sgr
       SET sgr.porc_completado = ROUND((SELECT ROUND((sor.cantidad_aceptada * 100) / sor.cantidad_a_fabricar, 1)
                                         FROM sch_of_rutas sor
                                        WHERE sor.codigo_empresa = sgr.codigo_empresa
                                          AND sor.codigo_org_planta = sgr.codigo_org_planta
                                          AND sor.orden_de_fabricacion = sgr.orden_de_fabricacion
                                          AND sor.fase = sgr.fase
                                          AND sor.numero_secuencia_fabricacion = sgr.secuencia
                                          AND sor.codigo_simulacion = p_codigo_simulacion
                                          AND sor.tipo_fase = 'P'), 2),
           sgr.cant_aceptada =
           (SELECT sor.cantidad_aceptada
              FROM sch_of_rutas sor
             WHERE sor.codigo_empresa = sgr.codigo_empresa
               AND sor.codigo_org_planta = sgr.codigo_org_planta
               AND sor.orden_de_fabricacion = sgr.orden_de_fabricacion
               AND sor.fase = sgr.fase
               AND sor.numero_secuencia_fabricacion = sgr.secuencia
               AND sor.codigo_simulacion = p_codigo_simulacion
               AND sor.tipo_fase = 'P')
     WHERE sgr.numero_simulacion = p_codigo_simulacion
       AND sgr.id_sesion = p_id_sesion;

    UPDATE sch_grafico_recursos
       SET porc_completado = 0
     WHERE numero_simulacion = p_codigo_simulacion
       AND id_sesion = p_id_sesion
       AND porc_completado IS NULL;

    UPDATE sch_grafico_proyectos sgp
       SET sgp.porc_completado =
           (SELECT ROUND((sor.cantidad_aceptada * 100) / sor.cantidad_a_fabricar, 1)
              FROM sch_of_rutas sor
             WHERE sor.codigo_empresa = sgp.codigo_empresa
               AND sor.codigo_org_planta = sgp.codigo_org_planta
               AND sor.orden_de_fabricacion = sgp.orden_de_fabricacion
               AND sor.fase = sgp.fase
               AND sor.numero_secuencia_fabricacion = sgp.secuencia
               AND sor.codigo_simulacion = p_codigo_simulacion
               AND sor.tipo_fase = 'P'),
           sgp.cant_aceptada =
           (SELECT sor.cantidad_aceptada
              FROM sch_of_rutas sor
             WHERE sor.codigo_empresa = sgp.codigo_empresa
               AND sor.codigo_org_planta = sgp.codigo_org_planta
               AND sor.orden_de_fabricacion = sgp.orden_de_fabricacion
               AND sor.fase = sgp.fase
               AND sor.numero_secuencia_fabricacion = sgp.secuencia
               AND sor.codigo_simulacion = p_codigo_simulacion
               AND sor.tipo_fase = 'P')
     WHERE sgp.numero_simulacion = p_codigo_simulacion
       AND sgp.id_sesion = p_id_sesion;

    UPDATE sch_grafico_proyectos
       SET porc_completado = 0
     WHERE numero_simulacion = p_codigo_simulacion
       AND id_sesion = p_id_sesion
       AND porc_completado IS NULL;

    COMMIT;
  END;

  PROCEDURE prepara_grafico(p_codigo_simulacion VARCHAR2, p_codigo_org_planta VARCHAR2, p_codigo_empresa VARCHAR2, p_hasta_proyecto VARCHAR2, p_desde_proyecto VARCHAR2, p_maquina_hasta VARCHAR2,
                            p_maquina_desde VARCHAR2, p_of_hasta VARCHAR2, p_of_desde VARCHAR2, p_fecha_fabricacion_hasta DATE, p_fecha_fabricacion_desde DATE, p_id_sesion NUMBER,
                            p_desde_seccion VARCHAR2, p_hasta_seccion VARCHAR2, p_desde_tipo_maquina VARCHAR2, p_hasta_tipo_maquina VARCHAR2) IS
    --    IF p_MODELO = 'R' THEN
    r_sch_calculo_cab sch_calculo_cab%ROWTYPE;
    v_fecha_desde     NUMBER;
    v_fecha_hasta     NUMBER;
  BEGIN
    SELECT *
      INTO r_sch_calculo_cab
      FROM sch_calculo_cab
     WHERE codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND codigo_simulacion = p_codigo_simulacion;

    IF p_fecha_fabricacion_desde IS NOT NULL THEN
      v_fecha_desde := TRUNC(p_fecha_fabricacion_desde) - TO_DATE(r_sch_calculo_cab.inicio_horizonte, 'j');
    ELSE
      v_fecha_desde := NULL;
    END IF;

    IF p_fecha_fabricacion_desde IS NOT NULL THEN
      v_fecha_hasta := TRUNC(p_fecha_fabricacion_hasta) - TO_DATE(r_sch_calculo_cab.inicio_horizonte, 'j');
    ELSE
      v_fecha_hasta := NULL;
    END IF;

    DECLARE
      CURSOR c1 IS
        SELECT *
          FROM sch_grafico_recursos
         WHERE id_sesion = p_id_sesion
         ORDER BY recurso DESC
           FOR UPDATE;

      var_anterior VARCHAR2(100) := '0';
      var_y        NUMBER := 0;
    BEGIN
      INSERT INTO sch_grafico_recursos
        (codigo_empresa, codigo_org_planta, numero_simulacion, orden_de_fabricacion, secuencia, fase, linea, tipo, codigo_cliente, desc_cliente, codigo_articulo, desc_articulo, fecha_ini, fecha_fin,
         recurso, desc_recurso, cant_aceptada, cant_a_fabricar, porc_completado, situ_ruta, proyecto, y, nexttask, nextrecurso, id_sesion, recurso_libra, nivel, reservadoa01)
        SELECT codigo_empresa, codigo_org_planta, simu, nof, sec, fase, linea, tipo, codigo_cliente, desc_cliente, codigo_articulo, desc_articulo, f_ini, f_fin,
               RPAD(SUBSTR(maq || ':  ' || desc_maq, 1, 17), 20, '  ') maq, desc_maq, NVL(cant_acept, 0), cant_a_fab, 0, situ_ruta, proye, 0, -1, NULL, p_id_sesion, maq, 2, NVL(reservadoa01, 0)
          FROM (SELECT r.codigo_empresa, r.codigo_org_planta, r.orden_de_fabricacion nof, r.numero_secuencia_fabricacion sec, r.fase fase, r.num_linea_ruta linea, 'F' tipo, r.fecha_ini_prevista f_ini,
                        r.fecha_fin_prevista f_fin, r.codigo_maquina maq, m.desc_maquina desc_maq, r.cantidad_aceptada cant_acept, r.cantidad_a_fabricar cant_a_fab, r.situacion_ruta situ_ruta,
                        c.proyecto proye, r.codigo_simulacion simu, c.codigo_cliente, cli.nombre desc_cliente, c.codigo_articulo, a.descrip_comercial desc_articulo,
                        (SELECT NVL(ec.codigo_articulo_compo, '0')
                            FROM estructuras_compo ec
                           WHERE ec.codigo_empresa = a.codigo_empresa
                             AND ec.codigo_articulo = a.codigo_articulo
                             AND ec.codigo_articulo_compo LIKE 'FG%'
                             AND ec.codigo_articulo_compo NOT LIKE '%COL%') reservadoa01, m.codigo_seccion seccion, m.tipo_maquina
                   FROM maquinas m, sch_of_cab c, sch_of_rutas r, articulos a, clientes cli, sch_actividades ac, sch_calculo sc
                  WHERE c.situacion_of != 'C'
                    AND r.codigo_empresa = c.codigo_empresa
                    AND r.codigo_org_planta = c.codigo_org_planta
                    AND r.orden_de_fabricacion = c.orden_de_fabricacion
                    AND m.codigo_empresa = r.codigo_empresa
                    AND m.codigo_org_planta = r.codigo_org_planta
                    AND m.codigo_maquina = r.codigo_maquina
                    AND r.maq_asignada_en_calculo = 'S'
                    AND r.codigo_simulacion = c.codigo_simulacion
                    AND a.codigo_empresa = c.codigo_empresa
                    AND a.codigo_articulo = c.codigo_articulo
                    AND cli.codigo_empresa(+) = c.codigo_empresa
                    AND cli.codigo_rapido(+) = c.codigo_cliente
                    AND sc.codigo_empresa = ac.codigo_empresa
                    AND sc.codigo_org_planta = ac.codigo_org_planta
                    AND sc.codigo_simulacion = ac.codigo_simulacion
                    AND sc.num_of = ac.num_of
                    AND sc.fase = ac.fase
                    AND sc.secuencia = ac.secuencia
                    AND sc.num_linea_ruta = ac.num_linea_ruta
                    AND r.codigo_empresa = ac.codigo_empresa
                    AND r.codigo_org_planta = ac.codigo_org_planta
                    AND r.orden_de_fabricacion = ac.num_of
                    AND r.fase = ac.fase
                    AND r.numero_secuencia_fabricacion = ac.secuencia
                    AND r.codigo_simulacion = ac.codigo_simulacion
                    AND r.num_linea_ruta = ac.num_linea_ruta)
         WHERE (p_fecha_fabricacion_desde IS NULL OR f_ini >= p_fecha_fabricacion_desde)
           AND (p_fecha_fabricacion_hasta IS NULL OR f_ini <= p_fecha_fabricacion_hasta)
           AND ((SELECT COUNT(*)
                   FROM p_sch_seleccion_of pso
                  WHERE pso.empresa = p_codigo_empresa
                    AND pso.codigo_org_planta = p_codigo_org_planta
                    AND pso.codigo_simulacion = p_codigo_simulacion) > 0 AND
               (nof IN (SELECT pso.orden_de_fabricacion
                           FROM p_sch_seleccion_of pso
                          WHERE pso.empresa = p_codigo_empresa
                            AND pso.codigo_org_planta = p_codigo_org_planta
                            AND pso.codigo_simulacion = p_codigo_simulacion) OR
               ((nof >= p_of_desde AND p_of_hasta IS NULL) OR (nof <= p_of_hasta AND p_of_desde IS NULL) OR (nof <= p_of_hasta AND nof >= p_of_desde))) OR
               ((SELECT COUNT(*)
                    FROM p_sch_seleccion_of pso
                   WHERE pso.empresa = p_codigo_empresa
                     AND pso.codigo_org_planta = p_codigo_org_planta
                     AND pso.codigo_simulacion = p_codigo_simulacion) = 0 AND (p_of_desde IS NULL OR nof >= p_of_desde) AND (p_of_hasta IS NULL OR nof <= p_of_hasta)))
           AND (p_maquina_desde IS NULL OR maq >= p_maquina_desde)
           AND (p_maquina_hasta IS NULL OR maq <= p_maquina_hasta)
           AND (p_desde_proyecto IS NULL OR proye >= p_desde_proyecto)
           AND (p_hasta_proyecto IS NULL OR proye <= p_hasta_proyecto)
           AND (p_desde_seccion IS NULL OR p_desde_seccion <= seccion)
           AND (p_hasta_seccion IS NULL OR p_hasta_seccion >= seccion)
           AND (p_desde_tipo_maquina IS NULL OR p_desde_tipo_maquina <= tipo_maquina)
           AND (p_hasta_tipo_maquina IS NULL OR p_hasta_tipo_maquina >= tipo_maquina)
           AND codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_codigo_org_planta
              ---               AND situ_ruta = 'A'
           AND tipo = 'F'
           AND simu = p_codigo_simulacion;
      FOR x IN c1 LOOP
        IF x.recurso = var_anterior THEN
          UPDATE sch_grafico_recursos
             SET y = var_y
           WHERE CURRENT OF c1;
        ELSE
          var_y := var_y + 1;

          UPDATE sch_grafico_recursos
             SET y = var_y
           WHERE CURRENT OF c1;
        END IF;

        var_anterior := x.recurso;
      END LOOP;
    END;

    DECLARE
      -- insertaremos las O.F. de los proyectos uno por uno para evitar mezclas en O.F. en caso de artículos idénticos.
      CURSOR c_proyectos IS
        SELECT DISTINCT (proyecto) proyecto
          FROM sch_of_cab
         WHERE codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_codigo_org_planta
           AND codigo_simulacion = p_codigo_simulacion
           AND (proyecto >= p_desde_proyecto OR p_desde_proyecto IS NULL)
           AND (proyecto <= p_hasta_proyecto OR p_hasta_proyecto IS NULL);

      CURSOR c_actividades(v_proyecto VARCHAR2) IS
        SELECT DISTINCT (num_of) num_of
          FROM sch_actividades
         WHERE codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_codigo_org_planta
           AND codigo_simulacion = p_codigo_simulacion
           AND proyecto = v_proyecto
           AND num_of_padre IS NULL;
    BEGIN
      FOR x IN c_proyectos LOOP
        FOR y IN c_actividades(x.proyecto) LOOP
          IF x.proyecto != 'CALCNEC' THEN
            INSERT INTO sch_grafico_proyectos
              (secuencia, codigo_empresa, codigo_org_planta, numero_simulacion, orden_de_fabricacion, fase, linea, tipo, codigo_articulo, desc_articulo, codigo_cliente, desc_cliente, fecha_ini,
               fecha_fin, recurso, desc_recurso, cant_aceptada, cant_a_fabricar, porc_completado, situ_ruta, proyecto, organizacion_compras, serie_numeracion, numero_pedido, codigo_proveedor,
               desc_proveedor, y, nexttask, nextrecurso, id_sesion, recurso_libra, nivel, reservadoa01)
              SELECT DISTINCT (secuencia), codigo_empresa, codigo_org_planta, codigo_simulacion, orden_fab, fase, num_linea_ruta, 'F', codigo_articulo, descrip_tecnica, codigo_cliente, nombre, NULL,
                              NULL, num_of, desc_maquina, cant_acept, cantidad_a_fabricar, cant, situacion_ruta, proyecto, NULL, NULL, NULL, NULL, NULL, NULL, '-1', num_of_padre, p_id_sesion,
                              codigo_maquina, 2, NVL(reservadoa01, 0)
                FROM (SELECT c.codigo_empresa, ofc.codigo_org_planta, c.codigo_simulacion, c.num_of orden_fab, c.secuencia, c.fase, ofc.num_linea_ruta, 'F', ofc.codigo_articulo, aa.descrip_tecnica,
                              ofcab.codigo_cliente, cli.nombre, NULL, NULL, c.num_of, SUBSTR(aa.descrip_tecnica, 1, 20) descrip, NVL(ofc.cantidad_aceptada, 0) cant_acept, ofc.cantidad_a_fabricar,
                              (100 / ofc.cantidad_a_fabricar * NVL(ofc.cantidad_aceptada, 0)) cant, ofc.situacion_ruta, a.proyecto, NULL, NULL, NULL, NULL, NULL, rownum - 1, '-1', a.num_of_padre,
                              m.desc_maquina, m.codigo_maquina,
                              (SELECT NVL(ec.codigo_articulo_compo, '0')
                                  FROM estructuras_compo ec
                                 WHERE ec.codigo_empresa = aa.codigo_empresa
                                   AND ec.codigo_articulo = aa.codigo_articulo
                                   AND ec.codigo_articulo_compo LIKE 'FG%'
                                   AND ec.codigo_articulo_compo NOT LIKE '%COL%') reservadoa01, m.codigo_seccion, m.tipo_maquina
                         FROM sch_calculo c, sch_actividades a, sch_of_rutas ofc, sch_of_cab ofcab, clientes cli, articulos aa, maquinas m
                        WHERE c.codigo_empresa = a.codigo_empresa
                          AND c.codigo_simulacion = a.codigo_simulacion
                          AND c.num_of = a.num_of
                          AND c.fase = a.fase
                          AND c.secuencia = a.secuencia
                          AND m.codigo_empresa = ofc.codigo_empresa
                          AND m.codigo_org_planta = ofc.codigo_org_planta
                          AND m.codigo_maquina = ofc.codigo_maquina
                          AND ofc.codigo_empresa = a.codigo_empresa
                          AND ofc.codigo_org_planta = a.codigo_org_planta
                          AND ofc.orden_de_fabricacion = a.num_of
                          AND ofc.fase = a.fase
                          AND ofc.numero_secuencia_fabricacion = a.secuencia
                          AND ofc.codigo_simulacion = a.codigo_simulacion
                          AND aa.codigo_empresa = ofc.codigo_empresa
                          AND aa.codigo_articulo = ofc.codigo_articulo
                          AND ofcab.codigo_simulacion = ofc.codigo_simulacion
                          AND ofcab.codigo_empresa = ofc.codigo_empresa
                          AND ofcab.codigo_org_planta = ofc.codigo_org_planta
                          AND ofcab.orden_de_fabricacion = ofc.orden_de_fabricacion
                          AND cli.codigo_empresa(+) = ofcab.codigo_empresa
                          AND cli.codigo_rapido(+) = ofcab.codigo_cliente
                          AND a.proyecto = x.proyecto
                          AND p_codigo_empresa = a.codigo_empresa
                          AND p_codigo_org_planta = a.codigo_org_planta
                          AND p_codigo_simulacion = a.codigo_simulacion
                          AND (v_fecha_desde IS NULL OR v_fecha_desde <= a.fecha_inicio_prev)
                          AND (v_fecha_hasta IS NULL OR v_fecha_hasta >= a.fecha_inicio_prev)
                          AND ((SELECT COUNT(*)
                                  FROM p_sch_seleccion_of pso
                                 WHERE pso.empresa = p_codigo_empresa
                                   AND pso.codigo_org_planta = p_codigo_org_planta
                                   AND pso.codigo_simulacion = p_codigo_simulacion) > 0 AND
                              (a.num_of IN (SELECT pso.orden_de_fabricacion
                                               FROM p_sch_seleccion_of pso
                                              WHERE pso.empresa = p_codigo_empresa
                                                AND pso.codigo_org_planta = p_codigo_org_planta
                                                AND pso.codigo_simulacion = p_codigo_simulacion) OR
                              ((a.num_of >= p_of_desde AND p_of_hasta IS NULL) OR (a.num_of <= p_of_hasta AND p_of_desde IS NULL) OR (a.num_of <= p_of_hasta AND a.num_of >= p_of_desde))) OR
                              ((SELECT COUNT(*)
                                   FROM p_sch_seleccion_of pso
                                  WHERE pso.empresa = p_codigo_empresa
                                    AND pso.codigo_org_planta = p_codigo_org_planta
                                    AND pso.codigo_simulacion = p_codigo_simulacion) = 0 AND (p_of_desde IS NULL OR a.num_of >= p_of_desde) AND (p_of_hasta IS NULL OR a.num_of <= p_of_hasta)))
                          AND (p_maquina_desde IS NULL OR p_maquina_desde <= a.maquina)
                          AND (p_maquina_hasta IS NULL OR p_maquina_hasta >= a.maquina)
                          AND (p_desde_seccion IS NULL OR p_desde_seccion <= codigo_seccion)
                          AND (p_hasta_seccion IS NULL OR p_hasta_seccion >= codigo_seccion)
                          AND (p_desde_tipo_maquina IS NULL OR p_desde_tipo_maquina <= tipo_maquina)
                          AND (p_hasta_tipo_maquina IS NULL OR p_hasta_tipo_maquina >= tipo_maquina)
                             --      AND OFC.TIPO_FASE = 'P'
                          AND ofc.maq_asignada_en_calculo = 'S' -- se sustituye por el tipo de fase 'P' ya que puede ser la alternativa la correcta
                       CONNECT BY PRIOR a.num_of = a.num_of_padre
                              AND a.codigo_simulacion = p_codigo_simulacion
                        START WITH a.num_of = y.num_of
                               AND a.codigo_simulacion = p_codigo_simulacion
                               AND a.codigo_empresa = p_codigo_empresa
                               AND a.codigo_org_planta = p_codigo_org_planta);
          ELSE
            -- MISMO INSERT PERO UTILIZANDO LA MIN(VV.NOF)
            INSERT INTO sch_grafico_proyectos
              (secuencia, codigo_empresa, codigo_org_planta, numero_simulacion, orden_de_fabricacion, fase, linea, tipo, codigo_articulo, desc_articulo, codigo_cliente, desc_cliente, fecha_ini,
               fecha_fin, recurso, desc_recurso, cant_aceptada, cant_a_fabricar, porc_completado, situ_ruta, proyecto, organizacion_compras, serie_numeracion, numero_pedido, codigo_proveedor,
               desc_proveedor, y, nexttask, nextrecurso, id_sesion, nivel, reservadoa01)
              SELECT DISTINCT (secuencia), codigo_empresa, codigo_org_planta, codigo_simulacion, orden_fab, fase, num_linea_ruta, 'F', codigo_articulo, descrip_tecnica, codigo_cliente, nombre, NULL,
                              NULL, num_of, desc_maquina, cant_acept, cantidad_a_fabricar, cant, situacion_ruta, proyecto, NULL, NULL, NULL, NULL, NULL, NULL, '-1', num_of_padre, p_id_sesion, 2,
                              NVL(reservadoa01, 0)
                FROM (SELECT c.codigo_empresa, ofc.codigo_org_planta, c.codigo_simulacion, c.num_of orden_fab, c.secuencia, c.fase, ofc.num_linea_ruta, 'F', ofc.codigo_articulo, aa.descrip_tecnica,
                              ofcab.codigo_cliente, cli.nombre, NULL, NULL, c.num_of, SUBSTR(aa.descrip_tecnica, 1, 20) descrip, NVL(ofc.cantidad_aceptada, 0) cant_acept, ofc.cantidad_a_fabricar,
                              (100 / ofc.cantidad_a_fabricar * NVL(ofc.cantidad_aceptada, 0)) cant, ofc.situacion_ruta, a.proyecto, NULL, NULL, NULL, NULL, NULL, rownum - 1, '-1', a.num_of_padre,
                              m.desc_maquina,
                              (SELECT NVL(ec.codigo_articulo_compo, '0')
                                  FROM estructuras_compo ec
                                 WHERE ec.codigo_empresa = aa.codigo_empresa
                                   AND ec.codigo_articulo = aa.codigo_articulo
                                   AND ec.codigo_articulo_compo LIKE 'FG%'
                                   AND ec.codigo_articulo_compo NOT LIKE '%COL%') reservadoa01
                         FROM sch_calculo c, sch_actividades a, sch_of_rutas ofc, sch_of_cab ofcab, clientes cli, articulos aa, maquinas m
                        WHERE c.codigo_empresa = a.codigo_empresa
                          AND c.codigo_simulacion = a.codigo_simulacion
                          AND c.num_of = a.num_of
                          AND c.fase = a.fase
                          AND c.secuencia = a.secuencia
                          AND m.codigo_empresa = ofc.codigo_empresa
                          AND m.codigo_org_planta = ofc.codigo_org_planta
                          AND m.codigo_maquina = ofc.codigo_maquina
                          AND ofc.codigo_empresa = a.codigo_empresa
                          AND ofc.codigo_org_planta = a.codigo_org_planta
                          AND ofc.orden_de_fabricacion = a.num_of
                          AND ofc.fase = a.fase
                          AND ofc.numero_secuencia_fabricacion = a.secuencia
                          AND ofc.codigo_simulacion = a.codigo_simulacion
                          AND aa.codigo_empresa = ofc.codigo_empresa
                          AND aa.codigo_articulo = ofc.codigo_articulo
                          AND ofcab.codigo_simulacion = ofc.codigo_simulacion
                          AND ofcab.codigo_empresa = ofc.codigo_empresa
                          AND ofcab.codigo_org_planta = ofc.codigo_org_planta
                          AND ofcab.orden_de_fabricacion = ofc.orden_de_fabricacion
                          AND cli.codigo_empresa(+) = ofcab.codigo_empresa
                          AND cli.codigo_rapido(+) = ofcab.codigo_cliente
                          AND a.proyecto = x.proyecto
                          AND p_codigo_empresa = a.codigo_org_planta
                          AND p_codigo_org_planta = a.codigo_org_planta
                          AND p_codigo_simulacion = a.codigo_simulacion
                          AND (v_fecha_desde IS NULL OR v_fecha_desde <= a.fecha_inicio_prev)
                          AND (v_fecha_hasta IS NULL OR v_fecha_hasta >= a.fecha_inicio_prev)
                          AND ((SELECT COUNT(*)
                                  FROM p_sch_seleccion_of pso
                                 WHERE pso.empresa = p_codigo_empresa
                                   AND pso.codigo_org_planta = p_codigo_org_planta
                                   AND pso.codigo_simulacion = p_codigo_simulacion) > 0 AND
                              (a.num_of IN (SELECT pso.orden_de_fabricacion
                                               FROM p_sch_seleccion_of pso
                                              WHERE pso.empresa = p_codigo_empresa
                                                AND pso.codigo_org_planta = p_codigo_org_planta
                                                AND pso.codigo_simulacion = p_codigo_simulacion) OR
                              ((a.num_of >= p_of_desde AND p_of_hasta IS NULL) OR (a.num_of <= p_of_hasta AND p_of_desde IS NULL) OR (a.num_of <= p_of_hasta AND a.num_of >= p_of_desde))) OR
                              ((SELECT COUNT(*)
                                   FROM p_sch_seleccion_of pso
                                  WHERE pso.empresa = p_codigo_empresa
                                    AND pso.codigo_org_planta = p_codigo_org_planta
                                    AND pso.codigo_simulacion = p_codigo_simulacion) = 0 AND (p_of_desde IS NULL OR a.num_of >= p_of_desde) AND (p_of_hasta IS NULL OR a.num_of <= p_of_hasta)))
                          AND (p_maquina_desde IS NULL OR p_maquina_desde <= a.maquina)
                          AND (p_maquina_hasta IS NULL OR p_maquina_hasta >= a.maquina)
                          AND (p_desde_seccion IS NULL OR p_desde_seccion <= codigo_seccion)
                          AND (p_hasta_seccion IS NULL OR p_hasta_seccion >= codigo_seccion)
                          AND (p_desde_tipo_maquina IS NULL OR p_desde_tipo_maquina <= tipo_maquina)
                          AND (p_hasta_tipo_maquina IS NULL OR p_hasta_tipo_maquina >= tipo_maquina)
                             --      AND OFC.TIPO_FASE = 'P'
                          AND ofc.maq_asignada_en_calculo = 'S' -- se sustituye por el tipo de fase 'P' ya que puede ser la alternativa la correcta
                       CONNECT BY PRIOR a.num_of = a.num_of_padre
                              AND a.codigo_simulacion = p_codigo_simulacion
                        START WITH a.num_of = (SELECT MIN(vv.nof)
                                                 FROM v_grafcm vv
                                                WHERE vv.codigo_empresa = a.codigo_empresa
                                                  AND vv.codigo_org_planta = a.codigo_org_planta
                                                  AND vv.proye = x.proyecto
                                                  AND vv.simu = a.codigo_simulacion)
                               AND a.codigo_simulacion = p_codigo_simulacion
                               AND a.codigo_empresa = p_codigo_empresa
                               AND a.codigo_org_planta = p_codigo_org_planta);

          END IF;
        END LOOP;
      END LOOP;
    END;

    DECLARE
      -- CURSOR PARA ASIGNAR NUMERO DE LINEA
      CURSOR g_proyectos IS
        SELECT *
          FROM sch_grafico_proyectos
         WHERE codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_codigo_org_planta
           AND numero_simulacion = p_codigo_simulacion
           AND id_sesion = p_id_sesion
         ORDER BY orden_de_fabricacion DESC, secuencia DESC;

      v_linea NUMBER := 0;
    BEGIN
      -- ASIGNAMOS NUMERO DE LINEA EN LA TABLA DE PROYECTOS
      FOR x IN g_proyectos LOOP
        UPDATE sch_grafico_proyectos
           SET y = v_linea
         WHERE codigo_empresa = x.codigo_empresa
           AND codigo_org_planta = x.codigo_org_planta
           AND numero_simulacion = x.numero_simulacion
           AND orden_de_fabricacion = x.orden_de_fabricacion
           AND secuencia = x.secuencia
           AND id_sesion = x.id_sesion;

        v_linea := v_linea + 1;
      END LOOP;

      COMMIT;
    END;

    -- MIRAMOS CUAL ES LA SIGUIENTE TAREA Y ASIGNAMOS
    UPDATE sch_grafico_proyectos g
       SET nexttask =
           (SELECT y
              FROM sch_grafico_proyectos gg
             WHERE g.codigo_empresa = gg.codigo_empresa
               AND g.codigo_org_planta = gg.codigo_org_planta
               AND g.proyecto = gg.proyecto
               AND g.nextrecurso = gg.recurso
               AND gg.numero_simulacion = g.numero_simulacion
               AND g.secuencia = gg.secuencia
               AND g.id_sesion = gg.id_sesion),
           fecha_ini =
           (SELECT MIN(ofr_i.f_ini)
              FROM v_grafcm ofr_i
             WHERE ofr_i.codigo_empresa = g.codigo_empresa
               AND ofr_i.codigo_org_planta = g.codigo_org_planta
               AND ofr_i.proye = g.proyecto
               AND ofr_i.nof = g.orden_de_fabricacion
               AND ofr_i.simu = g.numero_simulacion
               AND ofr_i.fase = g.fase
               AND ofr_i.sec = g.secuencia),
           fecha_fin =
           (SELECT MAX(ofr_f.f_fin)
              FROM v_grafcm ofr_f
             WHERE ofr_f.codigo_empresa = g.codigo_empresa
               AND ofr_f.codigo_org_planta = g.codigo_org_planta
               AND ofr_f.proye = g.proyecto
               AND ofr_f.nof = g.orden_de_fabricacion
               AND ofr_f.simu = g.numero_simulacion
               AND ofr_f.fase = g.fase
               AND ofr_f.sec = g.secuencia)
     WHERE g.codigo_empresa = p_codigo_empresa
       AND g.codigo_org_planta = p_codigo_org_planta
       AND (p_desde_proyecto IS NULL OR p_desde_proyecto <= g.proyecto)
       AND (p_hasta_proyecto IS NULL OR p_hasta_proyecto >= g.proyecto)
       AND g.numero_simulacion = p_codigo_simulacion
       AND g.id_sesion = p_id_sesion;

    UPDATE sch_grafico_proyectos g
       SET recurso = SUBSTR(TO_CHAR(g.orden_de_fabricacion) || '/' || TO_CHAR(g.secuencia) || ': ' || codigo_articulo, 1, 20),
           nexttask = NVL(nexttask, -1)
     WHERE g.codigo_empresa = p_codigo_empresa
       AND g.codigo_org_planta = p_codigo_org_planta
       AND (p_desde_proyecto IS NULL OR p_desde_proyecto <= g.proyecto)
       AND (p_hasta_proyecto IS NULL OR p_hasta_proyecto >= g.proyecto)
       AND g.numero_simulacion = p_codigo_simulacion
       AND g.id_sesion = p_id_sesion;

    -- DPF 17/02/2009 CALCULO EL PORCENTAJE COMPLETADO DE CADA O.F.
    -- Para ello primero actualizamos la cantidad aceptada en las tablas de simulacion
    actualiza_porc_completado(p_codigo_simulacion, p_id_sesion);

    -- DPF 27/05/2009 BUSCAMOS LA SIGUIENTE SECUENCIA DE FABRICACIÓN PARA ASIGNAR EN EL GRÁFICO LA SIGUIENTE TAREA A REALIZAR DENTRO DE LA MISMA O.F.
    DECLARE
      CURSOR g_proye IS
        SELECT *
          FROM sch_grafico_proyectos
         WHERE id_sesion = p_id_sesion
           FOR UPDATE;

      v_siguiente NUMBER;
    BEGIN
      FOR x IN g_proye LOOP
        BEGIN
          SELECT y
            INTO v_siguiente
            FROM sch_grafico_proyectos
           WHERE codigo_empresa = p_codigo_empresa
             AND codigo_org_planta = p_codigo_org_planta
             AND numero_simulacion = p_codigo_simulacion
             AND orden_de_fabricacion = x.orden_de_fabricacion
             AND id_sesion = x.id_sesion
             AND secuencia = x.secuencia + 1;

          UPDATE sch_grafico_proyectos
             SET nexttask = v_siguiente
           WHERE CURRENT OF g_proye;
          -- DPF 27/05/2009 SI NO EXISTE LA X.SECUENCIA +1 NO HACEMOS EL UPDATE, VAMOS AL NO_DATA_FOUND
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            -- DPF 15/10/2010 SI NO ENCUENTRO LA SIGUIENTE SECUENCIA TENEMOS QUE SALTAR AL SIGUIENTE RECURSO
            BEGIN
              SELECT y
                INTO v_siguiente
                FROM sch_grafico_proyectos
               WHERE codigo_empresa = p_codigo_empresa
                 AND codigo_org_planta = p_codigo_org_planta
                 AND numero_simulacion = p_codigo_simulacion
                 AND orden_de_fabricacion = x.nextrecurso
                 AND id_sesion = x.id_sesion
                 AND secuencia = 1;

              UPDATE sch_grafico_proyectos
                 SET nexttask = v_siguiente
               WHERE CURRENT OF g_proye;
            EXCEPTION
              WHEN NO_DATA_FOUND THEN
                NULL;
            END;
        END;
      END LOOP;
    END;
  END;

  PROCEDURE cambia_nivel_visualizado(p_id_sesion NUMBER, p_codigo_empresa VARCHAR2, p_codigo_org_planta VARCHAR2, p_numero_simulacion VARCHAR2, p_nivel NUMBER) IS
    CURSOR c_proyectos IS
      SELECT UNIQUE(proyecto) proyecto
        FROM sch_grafico_proyectos
       WHERE nivel = 2
         AND id_sesion = p_id_sesion
         AND codigo_empresa = p_codigo_empresa
         AND codigo_org_planta = p_codigo_org_planta
         AND numero_simulacion = p_numero_simulacion;

    CURSOR c_ofs IS
      SELECT UNIQUE(orden_de_fabricacion) orden_de_fabricacion
        FROM sch_grafico_proyectos
       WHERE nivel = 2
         AND id_sesion = p_id_sesion
         AND codigo_empresa = p_codigo_empresa
         AND codigo_org_planta = p_codigo_org_planta
         AND numero_simulacion = p_numero_simulacion;

    CURSOR c_ordenar IS
      SELECT *
        FROM sch_grafico_proyectos
       WHERE nivel = p_nivel
         AND id_sesion = p_id_sesion
         AND codigo_empresa = p_codigo_empresa
         AND codigo_org_planta = p_codigo_org_planta
         AND numero_simulacion = p_numero_simulacion
       ORDER BY orden_de_fabricacion DESC
         FOR UPDATE;

    v_posicion NUMBER;
  BEGIN
    /*--------------------------------------------------------------------------------------
    P_NIVEL:
    0 ->  PRYECTO
    1 ->  ORDEN DE FABRICACIÓN
    2 ->  OPERACIÓN
    */ --------------------------------------------------------------------------------------

    DELETE FROM sch_grafico_proyectos
     WHERE id_sesion = p_id_sesion
       AND codigo_empresa = p_codigo_empresa
       AND codigo_org_planta = p_codigo_org_planta
       AND numero_simulacion = p_numero_simulacion
       AND nivel IN (1, 0);

    IF p_nivel = 0 THEN
      v_posicion := 1;

      FOR x IN c_proyectos LOOP

        INSERT INTO sch_grafico_proyectos
          (proyecto, id_sesion, codigo_empresa, codigo_org_planta, numero_simulacion, orden_de_fabricacion, secuencia, fase, linea, fecha_fin, nivel, situ_ruta, cant_a_fabricar, tipo, codigo_cliente,
           desc_cliente, codigo_articulo, desc_articulo, recurso, desc_recurso, cant_aceptada, nexttask, porc_completado, recurso_libra, y)
          SELECT proyecto, id_sesion, codigo_empresa, codigo_org_planta, numero_simulacion, orden_de_fabricacion, secuencia, fase, linea, fecha_fin, 0, situ_ruta, cant_a_fabricar, tipo, codigo_cliente,
                 desc_cliente, codigo_articulo, desc_articulo, recurso, desc_recurso, cant_aceptada, nexttask, porc_completado, recurso_libra, v_posicion
            FROM sch_grafico_proyectos sgr2
           WHERE sgr2.nivel = 2
             AND sgr2.id_sesion = p_id_sesion
             AND sgr2.codigo_empresa = p_codigo_empresa
             AND sgr2.codigo_org_planta = p_codigo_org_planta
             AND sgr2.numero_simulacion = p_numero_simulacion
             AND sgr2.proyecto = x.proyecto
             AND sgr2.orden_de_fabricacion = (SELECT MAX(orden_de_fabricacion)
                                                FROM sch_grafico_proyectos sgr
                                               WHERE sgr2.id_sesion = sgr.id_sesion
                                                 AND sgr2.codigo_empresa = sgr.codigo_empresa
                                                 AND sgr2.codigo_org_planta = sgr.codigo_org_planta
                                                 AND sgr2.numero_simulacion = sgr.numero_simulacion
                                                 AND sgr2.proyecto = sgr.proyecto)
             AND sgr2.secuencia = (SELECT MAX(secuencia)
                                     FROM sch_grafico_proyectos sgr
                                    WHERE sgr2.id_sesion = sgr.id_sesion
                                      AND sgr2.codigo_empresa = sgr.codigo_empresa
                                      AND sgr2.codigo_org_planta = sgr.codigo_org_planta
                                      AND sgr2.numero_simulacion = sgr.numero_simulacion
                                      AND sgr2.proyecto = sgr.proyecto
                                      AND sgr2.orden_de_fabricacion = sgr.orden_de_fabricacion);

        UPDATE sch_grafico_proyectos sgr2
           SET sgr2.fecha_ini =
               (SELECT MIN(sgr.fecha_ini)
                  FROM sch_grafico_proyectos sgr
                 WHERE sgr.nivel = 2
                   AND sgr.proyecto = x.proyecto)
         WHERE sgr2.nivel = 0
           AND sgr2.id_sesion = p_id_sesion
           AND sgr2.codigo_empresa = p_codigo_empresa
           AND sgr2.codigo_org_planta = p_codigo_org_planta
           AND sgr2.numero_simulacion = p_numero_simulacion
           AND sgr2.proyecto = x.proyecto;

        v_posicion := v_posicion + 1;
      END LOOP;
    ELSIF p_nivel = 1 THEN
      v_posicion := 1;

      FOR x IN c_ofs LOOP
        INSERT INTO sch_grafico_proyectos
          (proyecto, id_sesion, codigo_empresa, codigo_org_planta, numero_simulacion, orden_de_fabricacion, secuencia, fase, linea, fecha_fin, nivel, situ_ruta, cant_a_fabricar, tipo, codigo_cliente,
           desc_cliente, codigo_articulo, desc_articulo, recurso, desc_recurso, cant_aceptada, nexttask, porc_completado, recurso_libra, y)
          SELECT proyecto, id_sesion, codigo_empresa, codigo_org_planta, numero_simulacion, orden_de_fabricacion, secuencia, fase, linea, fecha_fin, 1, situ_ruta, cant_a_fabricar, tipo, codigo_cliente,
                 desc_cliente, codigo_articulo, desc_articulo, recurso, desc_recurso, cant_aceptada, nexttask, porc_completado, recurso_libra, v_posicion
            FROM sch_grafico_proyectos sgr2
           WHERE sgr2.nivel = 2
             AND sgr2.id_sesion = p_id_sesion
             AND sgr2.codigo_empresa = p_codigo_empresa
             AND sgr2.codigo_org_planta = p_codigo_org_planta
             AND sgr2.numero_simulacion = p_numero_simulacion
             AND sgr2.orden_de_fabricacion = x.orden_de_fabricacion
             AND sgr2.secuencia = (SELECT MAX(secuencia)
                                     FROM sch_grafico_proyectos sgr
                                    WHERE sgr2.id_sesion = sgr.id_sesion
                                      AND sgr2.codigo_empresa = sgr.codigo_empresa
                                      AND sgr2.codigo_org_planta = sgr.codigo_org_planta
                                      AND sgr2.numero_simulacion = sgr.numero_simulacion
                                      AND sgr2.proyecto = sgr.proyecto
                                      AND sgr2.orden_de_fabricacion = sgr.orden_de_fabricacion);

        UPDATE sch_grafico_proyectos sgr2
           SET sgr2.fecha_ini =
               (SELECT MIN(sgr.fecha_ini)
                  FROM sch_grafico_proyectos sgr
                 WHERE sgr.nivel = 2
                   AND sgr.orden_de_fabricacion = x.orden_de_fabricacion)
         WHERE sgr2.nivel = 1
           AND sgr2.id_sesion = p_id_sesion
           AND sgr2.codigo_empresa = p_codigo_empresa
           AND sgr2.codigo_org_planta = p_codigo_org_planta
           AND sgr2.numero_simulacion = p_numero_simulacion
           AND sgr2.orden_de_fabricacion = x.orden_de_fabricacion;

        v_posicion := v_posicion + 1;
      END LOOP;
    END IF;

    IF p_nivel IN (0, 1) THEN
      v_posicion := 1;

      FOR x IN c_ordenar LOOP
        UPDATE sch_grafico_proyectos
           SET y = v_posicion
         WHERE nivel = p_nivel
           AND id_sesion = p_id_sesion
           AND codigo_empresa = p_codigo_empresa
           AND codigo_org_planta = p_codigo_org_planta
           AND numero_simulacion = p_numero_simulacion
           AND orden_de_fabricacion = x.orden_de_fabricacion;

        v_posicion := v_posicion + 1;
      END LOOP;
    END IF;

    COMMIT;
  END;
END sch_carga_maquinas;
/
