/*SELECT id_sesion, numero_simulacion, codigo_org_planta, orden_de_fabricacion, secuencia, fase, linea, codigo_articulo, tipo, fecha_ini, fecha_fin, recurso, desc_recurso, porc_completado
    FROM TABLE(pk_web_p_ccmaqs_xe.get_ofs_graph('1', '01', '03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL));
*/

SELECT orden_de_fabricacion, secuencia, codigo_articulo, recurso, desc_recurso
  FROM TABLE(pk_web_p_ccmaqs_xe.get_recursos_graph('1', '01', '03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL));
