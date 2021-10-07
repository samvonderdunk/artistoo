# rm -f *.pickle
# mkdir current_processing
python3 plot_death.py &
python3 plot_unmut.py &
# python3 plot_rep.py &
python3 plot_unmut_pop.py &
python3 plot_parallelid.py &
python3 plot_correction.py &
python3 plot_correction1000.py &