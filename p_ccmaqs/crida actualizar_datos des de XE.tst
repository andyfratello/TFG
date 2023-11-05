PL/SQL Developer Test script 3.0
18
-- Created on 30/10/2023 by EDISA 
DECLARE
  -- Local variables here
  v_result VARCHAR2(50);
BEGIN
  -- Test statements here
  v_result := pk_web_p_ccmaqs_xe.actualizar_datos_tarea('03', '01', '1', 67, 1, '06/11/2023 11:00:00');

  dbms_output.put_line(v_result);

  /* SELECT tiempo_fin
   INTO v_result
   FROM sch_calculo
  WHERE num_of =  70 -- p_num_of
    AND secuencia = 1 -- p_secuencia
    AND codigo_simulacion = '1' --p_codigo_simulacion
    AND codigo_empresa = '03'; -- p_codigo_empresa;*/
END;
0
0
